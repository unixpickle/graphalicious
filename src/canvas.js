//deps event_emitter.js

// A Canvas is used for drawing the contents of a graphalicious graph.
//
// Canvas implements the EventEmitter protocol. It emits "layout" events
// whenever its layout() method is called.
function Canvas() {
  EventEmitter.call(this);

  this._canvas = document.createElement('canvas');
  this._context = this._canvas.getContext('2d');

  this._animationsEnabled = true;

  this._ratio = window.crystal.getRatio();
  this._boundCrystalCallback = this._crystalCallback.bind(this);
  window.crystal.addListener(this._boundCrystalCallback);
}

Canvas.prototype = Object.create(EventEmitter.prototype);

// context returns a 2D drawing context for this canvas.
Canvas.prototype.context = function() {
  return this._context;
};

// dispose removes any callbacks which the Canvas is registered for.
// The web application should call this when it is done using the Canvas.
Canvas.prototype.dispose = function() {
  window.crystal.removeListener(this._boundCrystalCallback);
};

// element returns the DOM element for the Canvas.
Canvas.prototype.element = function() {
  return this._canvas;
};

// getAnimationsEnabled returns whether or not animations are enabled on this canvas.
Canvas.prototype.getAnimationsEnabled = function() {
  return this._animationsEnabled;
};

// height returns the height of the canvas in CSS pixels.
Canvas.prototype.height = function() {
  return this._canvas.offsetHeight;
};

// layout re-draws the contents of the canvas.
// The web application should call this whenever the canvas changes size.
Canvas.prototype.layout = function() {
  // TODO: check if the canvas is already setup to draw at a higher pixel ratio (i.e. Safari).
  this._canvas.width = this.width() * this._ratio;
  this._canvas.height = this.height() * this._ratio;
  this._context = this._canvas.getContext('2d');
  this._scaleContextForRatio();
  this.emit('layout');
};

// setAnimationsEnabled tells the canvas and everything drawing within it whether or not to animate.
Canvas.prototype.setAnimationsEnabled = function(flag) {
  this._animationsEnabled = flag;
};

// viewport returns a Viewport that fills the canvas.
Canvas.prototype.viewport = function() {
  return new Viewport(this._canvas.getContext('2d'), 0, 0, this.width(), this.height());
};

// width returns the width of the canvas in CSS pixels.
Canvas.prototype.width = function() {
  return this._canvas.offsetWidth;
};

Canvas.prototype._crystalCallback = function() {
  this._ratio = Math.ceil(window.crystal.getRatio());
  this.layout();
};

Canvas.prototype._scaleContextForRatio = function() {
  this._context.scale(this._ratio, this._ratio);
};

exports.Canvas = Canvas;
