// harmonizer version 0.3.0
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

  function Harmonizer(context) {
    EventEmitter.call(this);

    this._context = context || exports.defaultContext;

    this._parent = null;
    this._children = [];

    this._animationState = ANIMATION_STOPPED;
    this._animationStartTime = 0;
    this._animationSkipTime = 0;
  }

  Harmonizer.prototype = Object.create(EventEmitter.prototype);
  Harmonizer.prototype.constructor = Harmonizer;

  Harmonizer.prototype.start = function() {
    switch (this._animationState) {
    case ANIMATION_RUNNING:
      return;
    case ANIMATION_STOPPED:
    case ANIMATION_PAUSED:
      this._animationState = ANIMATION_RUNNING;
      this._animationStartTime = getCurrentTime();
      this._context._addAnimatingHarmonizer(this);
      break;
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
      this._context._removeAnimatingHarmonizer(this);
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
      this._context._removeAnimatingHarmonizer(this);
      break;
    }
  };

  Harmonizer.prototype.requestPaint = function() {
    var root = this._rootHarmonizer();
    if (this._context._inAnimationFrame()) {
      this._context._addPaintHarmonizer(root);
    } else {
      root._paint();
    }
  };

  Harmonizer.prototype.appendChild = function(child) {
    assert(this._children.indexOf(child) < 0);
    assert(child._context === this._context);
    this._children.push(child);
    child._parent = this;
  };

  Harmonizer.prototype.removeChild = function(child) {
    var idx = this._children.indexOf(child);
    assert(idx >= 0);
    this._children.splice(idx, 1);
    child._parent = null;
  };

  Harmonizer.prototype.getParent = function() {
    return this._parent;
  };

  Harmonizer.prototype.spawnChild = function() {
    var res = new Harmonizer(this._context);
    this.appendChild(res);
    return res;
  };

  Harmonizer.prototype.makeSingleShot = function() {
    this.on('animationFrame', function() {
      this.stop();
      this.requestPaint();
    }.bind(this));
  };

  Harmonizer.prototype._handleFrame = function(time) {
    assert(this._animationState === ANIMATION_RUNNING);
    this.emit('animationFrame', time-this._animationStartTime+this._animationSkipTime);
  };

  Harmonizer.prototype._paint = function() {
    this.emit('paint');
  };

  Harmonizer.prototype._rootHarmonizer = function() {
    var root = this;
    while (root._parent !== null) {
      root = root._parent;
    }
    return root;
  };

  exports.Harmonizer = Harmonizer;


  function Context() {
    this._paintHarmonizers = [];
    this._animatingHarmonizers = [];
    this._animationFrameRequest = null;
    this._boundCallback = this._animationFrame.bind(this);
    this._isHandlingAnimationFrame = false;
  }

  Context.prototype._addAnimatingHarmonizer = function(h) {
    this._animatingHarmonizers.push(h);
    if (this._animationFrameRequest === null) {
      this._animationFrameRequest = requestAnimationFrameOrPolyfill(this._boundCallback);
    }
  };

  Context.prototype._removeAnimatingHarmonizer = function(h) {
    var idx = this._animatingHarmonizers.indexOf(h);
    assert(idx >= 0);
    this._animatingHarmonizers.splice(idx, 1);
    if (this._animatingHarmonizers.length === 0) {
      cancelAnimationFrameOrPolyfill(this._animationFrameRequest);
      this._animationFrameRequest = null;
    }
  };

  Context.prototype._inAnimationFrame = function() {
    return this._isHandlingAnimationFrame;
  };

  Context.prototype._addPaintHarmonizer = function(h) {
    var idx = this._paintHarmonizers.indexOf(h);
    if (idx < 0) {
      this._paintHarmonizers.push(h);
    }
  };

  Context.prototype._animationFrame = function(time) {
    this._isHandlingAnimationFrame = true;
    this._animationFrameRequest = requestAnimationFrameOrPolyfill(this._boundCallback);

    var destinations = this._animatingHarmonizers.slice();
    for (var i = 0, len = destinations.length; i < len; ++i) {
      var destination = destinations[i];
      if (this._animatingHarmonizers.indexOf(destination) < 0) {
        continue;
      }
      destination._handleFrame(time);
    }

    var paintHarmonizers = this._paintHarmonizers.slice();
    for (var i = 0, len = paintHarmonizers.length; i < len; ++i) {
      paintHarmonizers[i]._paint();
    }
    this._paintHarmonizers = [];

    this._isHandlingAnimationFrame = false;
  };

  exports.defaultContext = new Context();
  exports.Context = Context;


  function assert(flag) {
    if (!flag) {
      throw new Error('Assertion failure.');
    }
  }



})();
