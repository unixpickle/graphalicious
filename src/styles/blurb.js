//deps includes.js

// Blurb is used to represent a floating information bubble which points to a specific
// location on the screen.
//
// Blurbs can be animated in and out.
// While a blurb is animating, it will emit 'redraw' events periodically.
// When a Blurb is fully faded out, it will emit a 'hidden' event.
function Blurb(viewport, point, text) {
  EventEmitter.call(this);

  this._point = point;
  this._text = text;

  if (point.y+viewport.fullY >= viewport.fullHeight-Blurb.UP_DOWN_THRESHOLD) {
    this._side = Blurb.UP;
  } else if (point.x-viewport.fullX >= viewport.fullWidth/2) {
    this._side = Blurb.LEFT;
  } else {
    this._side = Blurb.RIGHT;
  }

  this._fadingIn = true;
  this._animationFrame = null;
  this._lastDrawTime = null;
  this._animationStartTime = null;
  this._animationStartTimeOffset = 0;

  this._boundAnimationFrame = this._animationFrame.bind(this);
}

Blurb.LEFT = 0;
Blurb.RIGHT = 1;
Blurb.UP = 2;
Blurb.DOWN = 3;

// Blurb.ARROW_SIZE is the length of the arrow, in pixels.
Blurb.ARROW_SIZE = 7;

// Blurb.MIN_ARROW_EDGE_DIST is the minimum number of pixels between an arrow and the
// edge of a blurb. This only applies to upward/downward facing blurbs.
Blurb.MIN_ARROW_EDGE_DIST = 2;

// Blurb.MIN_EDGE_DISTANCE is the minimum number of pixels between the edge of a blurb
// and the edge of the full viewport.
Blurb.MIN_EDGE_DISTANCE = 2;

// Blurb.UP_DOWN_THRESHOLD is used to compute the direction a blurb faces given a target point.
// If the point is less than or equal to UP_DOWN_THRESHOLD from the top or bottom of the viewport,
// the corresponding blurb will face up or down.
Blurb.UP_DOWN_THRESHOLD = 30;

// Blurb.SCROLLBAR_HEIGHT determines the number of pixels at the bottom of the viewport
// which should be considered off-limits to the Blurb.
Blurb.SCROLLBAR_HEIGHT = 14;

// These constants control fade animation timing.
Blurb.IN_DELAY = 200;
Blurb.IN_DURATION = 90;
Blurb.OUT_DURATION = 150;

Blurb.prototype = Object.create(EventEmitter.prototype);

Blurb.prototype.fadeIn = function() {
  var alpha = this._currentAlpha();
  if (alpha > 0) {
    this._animationStartTimeOffset = Blurb.IN_DELAY + Blurb.IN_DURATION*alpha;
  } else {
    this._animationStartTimeOffset = 0;
  }

  this._lastDrawTime = null;
  this._animationStartTime = null;
  this._fadeIn = true;

  if (this._animationFrame === null) {
    this._animationFrame = window.requestAnimationFrame(this._boundAnimationFrame);
  }
};

Blurb.prototype.fadeOut = function() {
  var alpha = this._currentAlpha();
  if (alpha < 1) {
    this._animationStartTimeOffset = Blurb.OUT_DURATION*(1-alpha);
  } else {
    this._animationStartTimeOffset = 0;
  }

  this._lastDrawTime = null;
  this._animationStartTime = null;
  this._fadeIn = false;

  if (this._animationFrame === null) {
    this._animationFrame = window.requestAnimationFrame(this._boundAnimationFrame);
  }
};

Blurb.prototype.draw = function(context) {
  // TODO: draw the blurb once and cache the image. This will make it easy
  // to set the opacity while possibly boosting performance.
};

Blurb.prototype._currentAlpha = function() {
  var elapsedTime = this._animationStartTimeOffset;
  if (this._animationStartTime !== null) {
    elapsedTime += this._lastDrawTime - this._animationStartTime;
  }
  if (this._fadeIn) {
    return Math.max(0, Math.min(1, (elapsedTime-Blurb.IN_DELAY)/Blurb.IN_DURATION));
  } else {
    return 1 - Math.max(0, Math.min(1, elapsedTime/Blurb.OUT_DURATION));
  }
};

Blurb.prototype._animationFrame = function(time) {
  this._lastDrawTime = time;
  if (this._animationStartTime === null) {
    this._animationStartTime = time;
    window.requestAnimationFrame(this._boundAnimationFrame);
    return;
  }

  this.emit('redraw');

  var alpha = this._currentAlpha();
  if ((alpha < 1 && this._fadeIn) || (alpha > 0 && this._fadeOut)) {
    window.requestAnimationFrame(this._boundAnimationFrame);
  } else if (!this._fadeIn) {
    this.emit('hidden');
  }
};
