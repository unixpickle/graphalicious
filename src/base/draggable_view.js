//deps event_emitter.js

var EASE_DURATION = 1000;

// DraggableView is an abstract base class for views which need to support user dragging.
//
// Subclasses of DraggableView must implement the following two methods:
// - *DOMElement* element() - return the element on which touches should be captured
// - *function(number)* _generateDragFunction(x, y) - generate a function which will be called with
//   x values as the user drags their mouse or finger along the screen. This will be called once for
//   every time the user initiates a drag. All coordinate arguments are in client coordinates. This
//   can return null to cancel the drag.
//
// DraggableView subclasses EventEmitter but does not fire any events.
function DraggableView() {
  EventEmitter.call(this);
  this._registerMouseEvents();
  this._registerTouchEvents();

  this._easeAnimationFrame = null;
  this._easeStartVelocity = 0;
  this._easeStartTime = -1;
  this._easeStartX = -1;
  this._easeAcceleration = -1;
  this._easeEventCallback = null;
}

DraggableView.prototype = Object.create(EventEmitter.prototype);

DraggableView.prototype.element = function() {
  throw new Error('subclasses must override element()');
};

DraggableView.prototype._generateDragFunction = function(x, y) {
  throw new Error('subclasses must override _generateDragFunction()');
};

DraggableView.prototype._shouldDragEase = function() {
  return false;
};

DraggableView.prototype._registerMouseEvents = function() {
  var shielding = document.createElement('div');
  shielding.style.width = '100%';
  shielding.style.height = '100%';
  shielding.style.position = 'fixed';

  var mouseMove, mouseUp;
  var eventCallback = null;
  var velocityTracker = null;

  mouseMove = function(e) {
    var x = e.clientX - this.element().getBoundingClientRect().left;
    eventCallback(x);
    velocityTracker.pushX(x);

    // NOTE: this fixes a problem where the cursor becomes an ibeam.
    e.preventDefault();
    e.stopPropagation();
  }.bind(this);

  mouseUp = function() {
    document.body.removeChild(shielding);
    window.removeEventListener('mousemove', mouseMove);
    window.removeEventListener('mouseup', mouseUp);

    if (this._shouldDragEase()) {
      this._startEasing(velocityTracker, eventCallback);
    }

    velocityTracker = null;
    eventCallback = null;
  }.bind(this);

  this.element().addEventListener('mousedown', function(e) {
    if (eventCallback !== null) {
      return;
    }

    var offset = this.element().getBoundingClientRect();
    eventCallback = this._generateDragFunction(e.clientX-offset.left, e.clientY-offset.top);
    if (eventCallback === null) {
      return;
    }

    // NOTE: this fixes a problem where the cursor becomes an ibeam.
    e.preventDefault();
    e.stopPropagation();

    document.body.appendChild(shielding);

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);

    this._stopEasing();
    velocityTracker = new VelocityTracker(e.clientX - offset.left);
  }.bind(this));
};

DraggableView.prototype._registerTouchEvents = function() {
  var e = this.element();
  var eventCallback = null;
  var velocityTracker = null;

  e.addEventListener('touchstart', function(e) {
    if (eventCallback !== null) {
      return;
    }

    var touch = e.changedTouches[0];
    var offset = this.element().getBoundingClientRect();
    var touchX = touch.clientX-offset.left;
    eventCallback = this._generateDragFunction(touchX, touch.clientY-offset.top);

    if (eventCallback !== null) {
      e.preventDefault();
      this._stopEasing();
      velocityTracker = new VelocityTracker(touchX);
    }
  }.bind(this));

  e.addEventListener('touchmove', function(e) {
    if (eventCallback !== null) {
      var offset = this.element().getBoundingClientRect();
      var x = e.changedTouches[0].clientX - offset.left;
      eventCallback(x);
      velocityTracker.pushX(x);
    }
  }.bind(this));

  var cancel = function() {
    if (eventCallback === null) {
      return;
    }
    if (this._shouldDragEase()) {
      this._startEasing(velocityTracker, eventCallback);
    }
    velocityTracker = null;
    eventCallback = null;
  }.bind(this);

  e.addEventListener('touchend', cancel);
  e.addEventListener('touchcancel', cancel);
};

DraggableView.prototype._startEasing = function(velocityTracker, callback) {
  this._stopEasing();
  this._easeStartVelocity = velocityTracker.velocity();
  this._easeStartTime = -1;
  this._easeStartX = velocityTracker.lastX();
  this._easeEventCallback = callback;
  this._easeAnimationFrame = window.requestAnimationFrame(this._handleEaseFrame.bind(this));
  this._easeAcceleration = -this._easeStartVelocity / EASE_DURATION;
};

DraggableView.prototype._stopEasing = function() {
  if (this._easeAnimationFrame) {
    window.cancelAnimationFrame(this._easeAnimationFrame);
    this._easeAnimationFrame = null;
    this._easeEventCallback = null;
  }
};

DraggableView.prototype._handleEaseFrame = function(curTime) {
  if (this._easeStartTime === -1) {
    this._easeStartTime = curTime;
    this._easeAnimationFrame = window.requestAnimationFrame(this._handleEaseFrame.bind(this));
    return;
  }

  var time = curTime - this._easeStartTime;
  var totalAccel = this._ease*time;
  var easeDone = Math.abs(this._easeAcceleration * time) > Math.abs(this._easeStartVelocity);
  if (easeDone) {
    time = -this._easeStartVelocity / this._easeAcceleration;
  }

  var newX = this._easeStartX + this._easeStartVelocity*time +
    0.5*this._easeAcceleration*Math.pow(time, 2);
  this._easeEventCallback(newX);

  if (easeDone) {
    this._stopEasing();
  } else {
    this._easeAnimationFrame = window.requestAnimationFrame(this._handleEaseFrame.bind(this));
  }
};

// A VelocityTracker takes x coordinates as they come in and figures out an average velocity for a
// "flick" motion.
function VelocityTracker(initialX) {
  var time = new Date().getTime();
  this._backstack = [{time: time, x: initialX}];
}

VelocityTracker.TIMESPAN = 300;

VelocityTracker.prototype.pushX = function(x) {
  var now = new Date().getTime();
  this._backstack.push({time: now, x: x});
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

VelocityTracker.prototype.lastX = function() {
  if (this._backstack.length === 0) {
    return 0;
  }
  return this._backstack[this._backstack.length-1].x;
};

VelocityTracker.prototype._cleanBackstack = function() {
  var now = new Date().getTime();
  for (var numRemove = 0, len = this._backstack.length; numRemove < len; ++numRemove) {
    if (this._backstack[numRemove].time > now - VelocityTracker.TIMESPAN) {
      this._backstack.splice(0, numRemove);
      return;
    }
  }
  this._backstack = [];
};
