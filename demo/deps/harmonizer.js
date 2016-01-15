// harmonizer version 0.1.0
//
// Copyright (c) 2016, Alex Nichol.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
(function() {

  var exports;
  if ('undefined' !== typeof self) {
    if (!self.harmonizer) {
      self.harmonizer = {};
    }
    exports = self.harmonizer;
  } else if ('undefined' !== typeof window) {
    if (!window.harmonizer) {
      window.harmonizer = {};
    }
    exports = window.harmonizer;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function RootFrameSource() {
    this._frameDestination = null;
    this._animationFrameRequest = null;
    this._boundCallback = this._animationFrame.bind(this);
  }

  RootFrameSource.prototype._addFrameDestination = function(dest) {
    assert(this._frameDestination === null);
    assert(this._animationFrameRequest === null);
    this._frameDestination = dest;
    this._animationFrameRequest = requestAnimationFrameOrPolyfill(this._boundCallback);
  };

  RootFrameSource.prototype._removeFrameDestination = function(dest) {
    assert(this._frameDestination !== null);
    assert(this._animationFrameRequest !== null);
    this._frameDestination = null;
    cancelAnimationFrameOrPolyfill(this._animationFrameRequest);
    this._animationFrameRequest = null;
  };

  RootFrameSource.prototype._animationFrame = function(time) {
    this._animationFrameRequest = requestAnimationFrameOrPolyfill(this._boundCallback);
    this._frameDestination._handleFrame(time);
  };


  var POLYFILL_FPS = 60;

  var supportsAnimationFrame = ('requestAnimationFrame' in window &&
    'undefined' !== typeof performance && 'now' in performance);

  function getCurrentTime() {
    if (supportsAnimationFrame) {
      return performance.now();
    } else {
      return new Date().getTime();
    }
  }

  function requestAnimationFrameOrPolyfill(func) {
    if (supportsAnimationFrame) {
      return window.requestAnimationFrame(func);
    } else {
      return setTimeout(function() {
        func(getCurrentTime());
      }, 1000/POLYFILL_FPS);
    }
  }

  function cancelAnimationFrameOrPolyfill(id) {
    if (supportsAnimationFrame) {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  }


  var ANIMATION_STOPPED = 0;
  var ANIMATION_RUNNING = 1;
  var ANIMATION_PAUSED = 2;

  function Harmonizer() {
    EventEmitter.call(this);

    this._rootFrameSource = new RootFrameSource();
    this._frameSource = this._rootFrameSource;
    this._frameDestinations = [];

    this._parent = null;

    this._animationState = ANIMATION_STOPPED;
    this._animationStartTime = 0;
    this._animationSkipTime = 0;

    this._takesRepaintRequests = false;
    this._propagatingPaint = false;
    this._needsRepaint = false;
  }

  Harmonizer.prototype = Object.create(EventEmitter.prototype);

  Harmonizer.prototype.start = function() {
    switch (this._animationState) {
    case ANIMATION_RUNNING:
      return;
    case ANIMATION_STOPPED:
    case ANIMATION_PAUSED:
      this._animationState = ANIMATION_RUNNING;
      this._animationStartTime = getCurrentTime();
      if (this._frameRetainCount() === 1) {
        this._frameSource._addFrameDestination(this);
      }
    }
  };

  Harmonizer.prototype.stop = function() {
    switch (this._animationState) {
    case ANIMATION_STOPPED:
      break;
    case ANIMATION_PAUSED:
      this._animationSkipTime = 0;
      this._animationState = ANIMATION_STOPPED;
      break;
    case ANIMATION_RUNNING:
      this._animationSkipTime = 0;
      this._animationState = ANIMATION_STOPPED;
      if (this._frameRetainCount() === 0) {
        this._frameSource._removeFrameDestination(this);
      }
      break;
    }
  };

  Harmonizer.prototype.pause = function() {
    switch (this._animationState) {
    case ANIMATION_PAUSED:
    case ANIMATION_STOPPED:
      break;
    case ANIMATION_RUNNING:
      this._animationSkipTime += getCurrentTime() - this._animationStartTime;
      this._animationState = ANIMATION_PAUSED;
      if (this._frameRetainCount() === 0) {
        this._frameSource._removeFrameDestination(this);
      }
      break;
    }
  };

  Harmonizer.prototype.requestPaint = function() {
    var root = this._rootHarmonizer();
    if (root._takesRepaintRequests) {
      root._needsRepaint = true;
    } else {
      root.emit('paint');
    }
  };

  Harmonizer.prototype.appendChild = function(child) {
    if (child._frameRetainCount() > 0) {
      child._frameSource._removeFrameDestination(child);
    }
    child._frameSource = this;
    child._parent = this;
    if (child._frameRetainCount() > 0) {
      this._addFrameDestination(child);
    }
  };

  Harmonizer.prototype.removeChild = function(child) {
    if (child._frameRetainCount() > 0) {
      this._removeFrameDestination(child);
    }
    child._frameSource = child._rootFrameSource;
    child._parent = null;
    if (child._frameRetainCount() > 0) {
      child._frameSource._addFrameDestination(child);
    }
  };

  Harmonizer.prototype.getParent = function() {
    return this._parent;
  };

  Harmonizer.prototype.spawnChild = function() {
    var res = new Harmonizer();
    this.appendChild(res);
    return res;
  };

  Harmonizer.prototype.makeSingleShot = function() {
    this.on('animationFrame', function() {
      this.stop();
      this.requestPaint();
    }.bind(this));
  };

  Harmonizer.prototype._addFrameDestination = function(dest) {
    this._frameDestinations.push(dest);
    if (this._frameRetainCount() === 1) {
      this._frameSource._addFrameDestination(this);
    }
  };

  Harmonizer.prototype._removeFrameDestination = function(dest) {
    var idx = this._frameDestinations.indexOf(dest);
    assert(idx >= 0);
    this._frameDestinations.splice(idx, 1);
    if (this._frameRetainCount() === 0) {
      this._frameSource._removeFrameDestination(this);
    }
  };

  Harmonizer.prototype._handleFrame = function(time) {
    this._takesRepaintRequests = (this._parent === null);
    this._needsRepaint = false;

    if (this._animationState === ANIMATION_RUNNING) {
      this.emit('animationFrame', time-this._animationStartTime+this._animationSkipTime);
    }

    // Prevent new destinations from getting callbacks for this animation frame.
    var destinations = this._frameDestinations.slice();
    for (var i = 0, len = destinations.length; i < len; ++i) {
      // Allow destinations to be removed during the animation frame.
      var dest = destinations[i];
      if (this._frameDestinations.indexOf(dest) < 0) {
        continue;
      }
      dest._handleFrame(time);
    }

    if (this._needsRepaint) {
      this.emit('paint');
    }
    this._takesRepaintRequests = false;
  };

  Harmonizer.prototype._frameRetainCount = function() {
    if (this._animationState === ANIMATION_RUNNING) {
      return 1 + this._frameDestinations.length;
    } else {
      return this._frameDestinations.length;
    }
  };

  Harmonizer.prototype._rootHarmonizer = function() {
    var root = this;
    while (root._parent !== null) {
      root = root._parent;
    }
    return root;
  };

  exports.Harmonizer = Harmonizer;


  function assert(flag) {
    if (!flag) {
      throw new Error('Assertion failure.');
    }
  }



})();
