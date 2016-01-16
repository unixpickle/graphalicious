// scrollerjs version 0.2.1
//
// Copyright (c) 2015, Alex Nichol and Jonathan Loeb.
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
    if (!self.scrollerjs) {
      self.scrollerjs = {};
    }
    exports = self.scrollerjs;
  } else if ('undefined' !== typeof window) {
    if (!window.scrollerjs) {
      window.scrollerjs = {};
    }
    exports = window.scrollerjs;
  } else if ('undefined' !== typeof module) {
    exports = module.exports;
  }

  function View(barPosition, context) {
    window.EventEmitter.call(this);

    var harmonizerContext = context || window.harmonizer.defaultContext;
    this._scrollWheelHarmonizer = new window.harmonizer.Harmonizer(context || harmonizerContext);

    this._barPosition = barPosition;
    this._element = document.createElement('div');
    this._element.style.position = 'relative';

    this._content = null;

    this._bar = new Bar(barPosition);
    this._element.appendChild(this._bar.element());

    this._draggable = false;

    this._isDragging = false;
    this._dragStartCursorPos = null;
    this._dragStartScrolledPixels = null;
    this._dragVelocityTracker = null;
    this._ease = null;

    this._touchTriggerClick = false;
    this._cancelMouseClick = false;

    this._mouseListenersBound = false;
    this._boundMouseUp = this._handleMouseUp.bind(this);
    this._boundMouseMove = this._handleMouseMove.bind(this);
    this._boundMouseClick = this._handleMouseClick.bind(this);

    this._registerMouseEvents();
    this._registerWheelEvents();

    if ('ontouchstart' in document.documentElement) {
      this._registerTouchEvents();
    }

    this._bar.on('scroll', this._handleBarScroll.bind(this));
  }

  View.BAR_POSITION_LEFT = 0;
  View.BAR_POSITION_TOP = 1;
  View.BAR_POSITION_RIGHT = 2;
  View.BAR_POSITION_BOTTOM = 3;

  View.prototype = Object.create(window.EventEmitter.prototype);
  View.prototype.constructor = View;

  View.prototype.element = function() {
    return this._element;
  };

  View.prototype.layout = function() {
    this._bar.layout();
  };

  View.prototype.getState = function() {
    return this._bar.getState();
  };

  View.prototype.setState = function(s) {
    this._bar.setState(s);
    this._stopEasing();
  };

  View.prototype.getDraggable = function() {
    return this._draggable;
  };

  View.prototype.setDraggable = function(f) {
    this._draggable = f;
  };

  View.prototype.getContent = function() {
    return this._content;
  };

  View.prototype.setContent = function(c) {
    if (this._content !== null) {
      this._element.removeChild(this._content);
    }
    this._content = c;
    if (c !== null) {
      this._element.insertBefore(c, this._bar.element());
    }
  };

  View.prototype.flash = function() {
    this._bar.flash();
  };

  View.prototype._handleBarScroll = function() {
    this._stopEasing();
    this._emitScroll();
  };

  View.prototype._registerMouseEvents = function() {
    this._element.addEventListener('mouseenter', function() {
      this.flash();
    }.bind(this));

    // NOTE: having two event listeners allows sub-elements to prevent dragging
    // by stopping mousedown events.
    this._element.addEventListener('mousedown', function() {
      this._setCancelMouseClick(false);
    }.bind(this), true);
    this._element.addEventListener('mousedown', this._handleMouseDown.bind(this));
  };

  View.prototype._handleMouseDown = function(e) {
    // NOTE: the user can't simultaneously click and stop easing.
    this._setCancelMouseClick(this._ease !== null);

    if (this._draggingStart(this._mouseEventCoordinate(e))) {
      e.stopPropagation();
      this._mouseListenersBound = true;
      window.addEventListener('mousemove', this._boundMouseMove, true);
      window.addEventListener('mouseup', this._boundMouseUp, true);
    }
  };

  View.prototype._handleMouseMove = function(e) {
    if (this._draggingMove(this._mouseEventCoordinate(e))) {
      this._setCancelMouseClick(true);
      e.stopPropagation();
    }
  };

  View.prototype._handleMouseUp = function(e) {
    if (this._draggingEnd()) {
      e.stopPropagation();
    }
  };

  View.prototype._handleMouseClick = function(e) {
    e.stopPropagation();
  };

  View.prototype._mouseEventCoordinate = function(e) {
    if (this._bar.getOrientation() === Bar.ORIENTATION_HORIZONTAL) {
      return e.clientX;
    } else {
      return e.clientY;
    }
  };

  View.prototype._setCancelMouseClick = function(flag) {
    if (flag === this._cancelMouseClick) {
      return;
    }
    if (flag) {
      this._element.addEventListener('click', this._boundMouseClick, true);
    } else {
      this._element.removeEventListener('click', this._boundMouseClick, true);
    }
    this._cancelMouseClick = flag;
  };

  View.prototype._registerTouchEvents = function() {
    this._element.addEventListener('touchstart', this._handleTouchStart.bind(this));
    this._element.addEventListener('touchmove', this._handleTouchMove.bind(this));
    this._element.addEventListener('touchend', this._handleTouchDone.bind(this));
    this._element.addEventListener('touchcancel', function() {
      this._touchTriggerClick = false;
      this._handleTouchDone();
    }.bind(this));
  };

  View.prototype._handleTouchStart = function(e) {
    e.preventDefault();

    // NOTE: the user can't simultaneously tap and stop easing.
    this._touchTriggerClick = (this._ease === null);

    this._draggingStart(this._touchEventCoordinate(e));
  };

  View.prototype._handleTouchMove = function(e) {
    if (this._draggingMove(this._touchEventCoordinate(e))) {
      this._touchTriggerClick = false;
    }
  };

  View.prototype._handleTouchDone = function(e) {
    this._draggingEnd();
    if (this._touchTriggerClick) {
      this._triggerClickEvent(e.changedTouches[0]);
    }
  };

  View.prototype._touchEventCoordinate = function(e) {
    var touch = e.changedTouches[0];
    if (this._bar.getOrientation() === Bar.ORIENTATION_HORIZONTAL) {
      return touch.clientX;
    } else {
      return touch.clientY;
    }
  };

  View.prototype._triggerClickEvent = function(posInfo) {
    if (this._content === null) {
      return;
    }

    var evt;
    var needsManualConfig = true;
    if ('createEvent' in document) {
      evt = document.createEvent('MouseEvents');
      evt.initMouseEvent('click', true, true, window, 1, posInfo.screenX,
        posInfo.screenY, posInfo.clientX, posInfo.clientY, false, false, false,
        false, 0, null);
    } else {
      needsManualConfig = false;
      evt = new MouseEvent('click', posInfo);
    }

    this._content.dispatchEvent(evt);
  };

  View.prototype._draggingStart = function(coord) {
    if (!this.getDraggable() || this._isDragging) {
      return false;
    }
    this._isDragging = true;

    this._stopEasing();
    this._dragStartCursorPos = coord;
    this._dragStartScrolledPixels = this.getState().getScrolledPixels();
    this._dragVelocityTracker = new VelocityTracker(this._dragStartCursorPos);

    return true;
  };

  View.prototype._draggingMove = function(coord) {
    if (!this._isDragging) {
      return false;
    }

    var diff = coord - this._dragStartCursorPos;
    var newScrollX = this._dragStartScrolledPixels - diff;

    this._dragVelocityTracker.pushOffset(coord);

    var s = this.getState();
    this.setState(new State(s.getTotalPixels(), s.getVisiblePixels(), newScrollX));
    this._emitScroll();

    this.flash();
    return true;
  };

  View.prototype._draggingEnd = function() {
    if (!this._isDragging) {
      return false;
    }
    this._isDragging = false;

    if (this._mouseListenersBound) {
      this._mouseListenersBound = false;
      window.removeEventListener('mousemove', this._boundMouseMove);
      window.removeEventListener('mouseup', this._boundMouseUp);
    }

    var velocity = this._dragVelocityTracker.velocity();
    this._dragVelocityTracker = null;
    if (Math.abs(velocity) > 0) {
      this._startEasing(velocity);
    }

    return true;
  };

  View.prototype._startEasing = function(velocity) {
    this._stopEasing();
    var h = this._scrollWheelHarmonizer.spawnChild();
    this._ease = new Ease(h, -velocity, this.getState().getScrolledPixels());
    this._ease.on('offset', function(x) {
      if (x < 0 || x > this.getState().maxScrolledPixels()) {
        this._stopEasing();
      }
      var s = this.getState();
      this._bar.setState(new State(s.getTotalPixels(), s.getVisiblePixels(), x));
      this._emitScroll();
    }.bind(this));
    this._ease.on('done', function() {
      this._scrollWheelHarmonizer.removeChild(this._ease.harmonizer());
      this._ease = null;
    }.bind(this));
    this._ease.start();
  };

  View.prototype._stopEasing = function() {
    if (this._ease !== null) {
      this._ease.cancel();
      this._scrollWheelHarmonizer.removeChild(this._ease.harmonizer());
      this._ease = null;
    }
  };

  View.prototype._registerWheelEvents = function() {
    // NOTE: combining wheel events helps performance on several browsers.

    var pendingDelta = 0;
    var secondaryDelta = 0;

    this._scrollWheelHarmonizer.makeSingleShot(function() {
      // NOTE: when you scroll vertically on a trackpad on OS X,
      // it unwantedly scrolls horizontally by a slight amount.
      if (Math.abs(secondaryDelta) > 2*Math.abs(pendingDelta)) {
        pendingDelta = 0;
        secondaryDelta = 0;
        return;
      }

      var state = this.getState();
      this.setState(new State(state.getTotalPixels(), state.getVisiblePixels(),
        state.getScrolledPixels() + pendingDelta));
      this._emitScroll();

      pendingDelta = 0;
      secondaryDelta = 0;

      this.flash();
    }.bind(this));

    this._element.addEventListener('wheel', function(e) {
      this._scrollWheelHarmonizer.start();
      if (this._bar.getOrientation() === Bar.ORIENTATION_HORIZONTAL) {
        pendingDelta += e.deltaX;
        secondaryDelta += e.deltaY;
      } else {
        pendingDelta += e.deltaY;
        secondaryDelta += e.deltaX;
      }
      e.preventDefault();
    }.bind(this));
  };

  View.prototype._emitScroll = function() {
    if (this.getState().maxScrolledPixels() !== 0) {
      this.emit('scroll');
    }
  };

  exports.View = View;


  // A VelocityTracker takes offsets as they come in and figures out
  // an average velocity for a "flick" motion.
  function VelocityTracker(offset0) {
    this._backstack = [];
    this.pushOffset(offset0);
  }

  VelocityTracker.TIMESPAN = 300;

  VelocityTracker.prototype.pushOffset = function(x) {
    this._backstack.push({time: new Date().getTime(), x: x});
    this._cleanBackstack();
  };

  VelocityTracker.prototype.velocity = function() {
    this._cleanBackstack();
    if (this._backstack.length === 0) {
      return 0;
    }

    var first = this._backstack[0];
    var last = this._backstack[this._backstack.length-1];

    if (last.time <= first.time) {
      return 0;
    }

    var dx = (last.x - first.x);
    var dt = (last.time - first.time);

    return dx / dt;
  };

  VelocityTracker.prototype.lastOffset = function() {
    if (this._backstack.length === 0) {
      return 0;
    }
    return this._backstack[this._backstack.length-1].x;
  };

  VelocityTracker.prototype._cleanBackstack = function() {
    var now = new Date().getTime();
    for (var i = 0, len = this._backstack.length; i < len; ++i) {
      if (this._backstack[i].time > now-VelocityTracker.TIMESPAN) {
        this._backstack.splice(0, i);
        return;
      }
    }
    this._backstack = [];
  };


  function addClass(element, c) {
    var classes = element.className.split(' ');
    if (classes.indexOf(c) < 0) {
      classes.push(c);
      element.className = classes.join(' ');
    }
  }

  function removeClass(element, c) {
    var classes = element.className.split(' ');
    var idx = classes.indexOf(c);
    if (idx >= 0) {
      classes.splice(idx, 1);
      element.className = classes.join(' ');
    }
  }


  function State(totalPixels, visiblePixels, scrolledPixels) {
    this._totalPixels = totalPixels;
    this._visiblePixels = visiblePixels;
    this._scrolledPixels = scrolledPixels;
  }

  State.prototype.equals = function(s) {
    return s.getTotalPixels() === this.getTotalPixels() &&
      s.getVisiblePixels() === this.getVisiblePixels() &&
      s.getScrolledPixels() === this.getScrolledPixels();
  };

  State.prototype.getTotalPixels = function() {
    return this._totalPixels;
  };

  State.prototype.getVisiblePixels = function() {
    return this._visiblePixels;
  };

  State.prototype.getScrolledPixels = function() {
    if (this._scrolledPixels < 0) {
      return 0;
    } else if (this._scrolledPixels >= this.maxScrolledPixels()) {
      return this.maxScrolledPixels();
    }
    return this._scrolledPixels;
  };

  State.prototype.maxScrolledPixels = function() {
    return Math.max(0, this._totalPixels-this._visiblePixels);
  };

  State.prototype.visibleRatio = function() {
    if (this._totalPixels === 0) {
      return 1;
    }
    return Math.min(1, this._visiblePixels/this._totalPixels);
  };

  State.prototype.scrolledRatio = function() {
    var maxScrolled = this.maxScrolledPixels();
    if (maxScrolled === 0) {
      return 0;
    }
    return this.getScrolledPixels() / maxScrolled;
  };

  exports.State = State;


  // Ease is used to gradually slow down a scroll view
  // after being flicked by the user.
  function Ease(harmonizer, startVelocity, startOffset) {
    window.EventEmitter.call(this);

    this._harmonizer = harmonizer;
    this._startVelocity = startVelocity;
    this._startOffset = startOffset;
    this._startTime = null;
    this._req = null;

    this._acceleration = -startVelocity / Ease.DURATION;
    this._harmonizer.on('animationFrame', this._tick.bind(this));
  }

  Ease.DURATION = 1000;

  Ease.prototype = Object.create(window.EventEmitter.prototype);
  Ease.prototype.constructor = Ease;

  Ease.prototype.harmonizer = function() {
    return this._harmonizer;
  };

  Ease.prototype.start = function() {
    this._harmonizer.start();
  };

  Ease.prototype.cancel = function() {
    this._harmonizer.stop();
  };

  Ease.prototype._tick = function(elapsedTime) {
    if (elapsedTime < 0) {
      this.cancel();
      this.emit('done');
      return;
    }

    var easeDone = (elapsedTime >= Ease.DURATION);
    if (easeDone) {
      elapsedTime = -this._startVelocity / this._acceleration;
    }

    var newOffset = this._startOffset + this._startVelocity*elapsedTime +
      0.5*this._acceleration*Math.pow(elapsedTime, 2);

    this.emit('offset', newOffset);

    if (easeDone) {
      this.cancel();
      this.emit('done');
    }
  };


  function Bar(position) {
    window.EventEmitter.call(this);

    this._position = position;
    this._element = document.createElement('div');
    this._element.className = 'scrollerjs-bar';

    this._thumb = document.createElement('div');
    this._thumb.className = 'scrollerjs-thumb';
    this._element.appendChild(this._thumb);

    if ((position & 1) === Bar.ORIENTATION_VERTICAL) {
      this._element.className += ' scrollerjs-vertical-bar';
      this._thumb.className += ' scrollerjs-vertical-thumb';
    } else {
      this._element.className += ' scrollerjs-horizontal-bar';
      this._thumb.className += ' scrollerjs-horizontal-thumb';
    }

    var positionName = '';
    switch (position) {
    case View.BAR_POSITION_LEFT:
      positionName = 'left';
      break;
    case View.BAR_POSITION_TOP:
      positionName = 'top';
      break;
    case View.BAR_POSITION_RIGHT:
      positionName = 'right';
      break;
    case View.BAR_POSITION_BOTTOM:
      positionName = 'bottom';
      break;
    }

    this._element.className += ' scrollerjs-' + positionName + '-bar';
    this._thumb.className += ' scrollerjs-' + positionName + '-thumb';

    this._hideTimeout = null;
    this._state = new State(0, 0, 0);

    this._isDragging = false;
    this._dragStartMousePos = 0;
    this._dragStartScrolledRatio = 0;
    this._boundMouseMove = this._handleMouseMove.bind(this);
    this._boundMouseUp = this._handleMouseUp.bind(this);
    this._registerMouseEvents();

    if ('ontouchstart' in document.documentElement) {
      this._disableTouchMouseEmulation();
    }
  }

  Bar.ORIENTATION_VERTICAL = 0;
  Bar.ORIENTATION_HORIZONTAL = 1;

  Bar.HIDE_TIMEOUT = 1000;
  Bar.MIN_THUMB_SIZE = 30;

  Bar.prototype = Object.create(window.EventEmitter.prototype);
  Bar.prototype.constructor = Bar;

  Bar.prototype.element = function() {
    return this._element;
  };

  Bar.prototype.layout = function() {
    var params = this._visualParameters();
    if (this.getOrientation() === Bar.ORIENTATION_HORIZONTAL) {
      this._thumb.style.left = Math.round(params.offset) + 'px';
      this._thumb.style.width = Math.round(params.thumbSize) + 'px';
    } else {
      this._thumb.style.top = Math.round(params.offset) + 'px';
      this._thumb.style.height = Math.round(params.thumbSize) + 'px';
    }
  };

  Bar.prototype.flash = function() {
    if (this._hideTimeout !== null) {
      clearTimeout(this._hideTimeout);
    } else {
      this._element.className += ' scrollerjs-bar-flashing';
    }
    this._hideTimeout = setTimeout(this._unflash.bind(this), Bar.HIDE_TIMEOUT);
  };

  Bar.prototype.getState = function() {
    return this._state;
  };

  Bar.prototype.setState = function(s) {
    if (s.maxScrolledPixels() === 0) {
      addClass(this._element, 'scrollerjs-bar-useless');
    } else {
      removeClass(this._element, 'scrollerjs-bar-useless');
    }
    if (!this._state.equals(s)) {
      this._state = s;
      this.layout();
    }
  };

  Bar.prototype.getOrientation = function() {
    return this._position & 1;
  };

  Bar.prototype._unflash = function() {
    this._hideTimeout = null;
    var classes = this._element.className.split(' ');
    for (var i = 0, len = classes.length; i < len; ++i) {
      if (classes[i] === 'scrollerjs-bar-flashing') {
        classes.splice(i, 1);
        this._element.className = classes.join(' ');
        return;
      }
    }
  };

  Bar.prototype._visualParameters = function() {
    var size = this._size();
    var thumbSize = Math.max(Bar.MIN_THUMB_SIZE, size*this._state.visibleRatio());
    var maxOffset = size - thumbSize;
    var offset = maxOffset * this._state.scrolledRatio();
    return {
      size: size,
      thumbSize: thumbSize,
      maxOffset: maxOffset,
      offset: offset
    };
  };

  Bar.prototype._size = function() {
    if (this.getOrientation() === Bar.ORIENTATION_HORIZONTAL) {
      return this._element.offsetWidth;
    } else {
      return this._element.offsetHeight;
    }
  };

  Bar.prototype._registerMouseEvents = function() {
    this._element.addEventListener('mouseenter', this._handleMouseEnter.bind(this));
    this._element.addEventListener('mouseleave', this._handleMouseLeave.bind(this));
    this._element.addEventListener('mousedown', this._handleMouseDown.bind(this));
  };

  Bar.prototype._handleMouseEnter = function() {
    addClass(this._element, 'scrollerjs-bar-focus');
  };

  Bar.prototype._handleMouseLeave = function() {
    if (this._isDragging) {
      return;
    }
    removeClass(this._element, 'scrollerjs-bar-focus');
    this.flash();
  };

  Bar.prototype._handleMouseDown = function(e) {
    if (this._isDragging) {
      return;
    }
    this._isDragging = true;
    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('mouseup', this._boundMouseUp);

    var params = this._visualParameters();
    var coordinate = this._mouseEventCoordinate(e);
    if (coordinate < params.offset || coordinate >= params.offset+params.thumbSize) {
      var newOffset = Math.max(0, Math.min(params.maxOffset, coordinate-(params.thumbSize/2)));
      this._state = new State(this._state.getTotalPixels(), this._state.getVisiblePixels(),
        (newOffset/params.maxOffset)*this._state.maxScrolledPixels());
      this.layout();
      this.emit('scroll');
    }

    this._dragStartScrolledRatio = this._state.scrolledRatio();
    this._dragStartMousePos = coordinate;

    e.preventDefault();
    e.stopPropagation();
  };

  Bar.prototype._handleMouseMove = function(e) {
    if (!this._isDragging) {
      throw new Error('got unexpected mousemove event');
    }

    var coordinate = this._mouseEventCoordinate(e);
    var diff = coordinate - this._dragStartMousePos;
    var params = this._visualParameters();

    var startOffset = this._dragStartScrolledRatio * params.maxOffset;
    var offset = Math.max(0, Math.min(params.maxOffset, startOffset+diff));

    this._state = new State(this._state.getTotalPixels(), this._state.getVisiblePixels(),
      (offset/params.maxOffset)*this._state.maxScrolledPixels());
    this.layout();
    this.emit('scroll');
  };

  Bar.prototype._handleMouseUp = function(e) {
    if (!this._isDragging) {
      throw new Error('got unexpected mouseup event');
    }
    this._isDragging = false;
    window.removeEventListener('mousemove', this._boundMouseMove);
    window.removeEventListener('mouseup', this._boundMouseUp);

    var barRect = this._element.getBoundingClientRect();
    if (e.clientX < barRect.left || e.clientY < barRect.top ||
        e.clientX >= barRect.left+this._element.offsetWidth ||
        e.clientY >= barRect.top+this._element.offsetHeight) {
      this._handleMouseLeave();
    }
  };

  Bar.prototype._mouseEventCoordinate = function(e) {
    if (this.getOrientation() === Bar.ORIENTATION_VERTICAL) {
      return e.clientY - this._element.getBoundingClientRect().top;
    } else {
      return e.clientX - this._element.getBoundingClientRect().left;
    }
  };

  Bar.prototype._disableTouchMouseEmulation = function() {
    this._element.addEventListener('touchstart', function(e) {
      e.preventDefault();
    });
  };



})();
