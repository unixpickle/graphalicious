//deps event_emitter.js

// DraggableView is an abstract base class for views which need to support user dragging.
//
// Subclasses of DraggableView must implement the following two methods:
// - *DOMElement* element() - return the element on which touches should be captured
// - *function(number)* _generateMoveFunction(x, y) - generate a function which will be called with
//   x values as the user drags their mouse or finger along the screen. The x and y arguments are
//   the client coordinates where the user clicked or touched to initiate movement. This can return
//   *null* to indicate that the touch should be ignored.
//
// DraggableView subclasses EventEmitter but does not fire any events.
function DraggableView() {
  EventEmitter.call(this);
  this._registerMouseEvents();
  this._registerTouchEvents();
}

DraggableView.prototype = Object.create(EventEmitter.prototype);

DraggableView.prototype.element = function() {
  throw new Error('subclasses must override element()');
};

DraggableView.prototype._generateMoveFunction = function(x, y) {
  throw new Error('subclasses must override _generateMoveFunction()');
};

DraggableView.prototype._registerMouseEvents = function() {
  var shielding = document.createElement('div');
  shielding.style.width = '100%';
  shielding.style.height = '100%';
  shielding.style.position = 'fixed';

  var mouseMove, mouseUp;
  var eventCallback = null;

  mouseMove = function(e) {
    eventCallback(e.clientX);

    // NOTE: this fixes a problem where the cursor becomes an ibeam.
    e.preventDefault();
    e.stopPropagation();
  }.bind(this);

  mouseUp = function() {
    eventCallback = null;
    document.body.removeChild(shielding);
    window.removeEventListener('mousemove', mouseMove);
    window.removeEventListener('mouseup', mouseUp);
  }.bind(this);

  this.element().addEventListener('mousedown', function(e) {
    if (eventCallback !== null) {
      return;
    }

    eventCallback = this._generateMoveFunction(e.clientX, e.clientY);
    if (eventCallback === null) {
      return;
    }

    // NOTE: this fixes a problem where the cursor becomes an ibeam.
    e.preventDefault();
    e.stopPropagation();

    document.body.appendChild(shielding);

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
  }.bind(this));
};

DraggableView.prototype._registerTouchEvents = function() {
  var e = this.element();
  var eventCallback = null;

  e.addEventListener('touchstart', function(e) {
    if (eventCallback === null) {
      var touch = e.changedTouches[0];
      eventCallback = this._generateMoveFunction(touch.clientX, touch.clientY);
    }
  }.bind(this));

  e.addEventListener('touchmove', function(e) {
    if (eventCallback !== null) {
      eventCallback(e.changedTouches[0].clientX);
    }
  }.bind(this));

  var cancel = function() {
    eventCallback = null;
  }.bind(this);

  e.addEventListener('touchend', cancel);
  e.addEventListener('touchcancel', cancel);
};
