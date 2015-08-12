//deps event_emitter.js

// A Canvas is used for drawing the contents of a graphalicious graph.
//
// Canvas implements the EventEmitter protocol. It emits "layout" events
// whenever its layout() method is called.
function Canvas() {
  EventEmitter.call(this);

  this._container = document.createElement('div');
  this._canvas = document.createElement('canvas');
  this._context = this._canvas.getContext('2d');

  this._container.appendChild(this._canvas);
  this._container.style.position = 'relative';
  this._canvas.style.position = 'absolute';
  this._canvas.style.width = '100%';
  this._canvas.style.height = '100%';

  this._currentOverlay = null;

  disableUserSelection(this._container);
  disableUserSelection(this._canvas);

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
  return this._container;
};

// getAnimationsEnabled returns whether or not animations are enabled on this canvas.
Canvas.prototype.getAnimationsEnabled = function() {
  return this._animationsEnabled;
};

// height returns the height of the canvas in CSS pixels.
Canvas.prototype.height = function() {
  return this._canvas.offsetHeight;
};

// hideOverlay hides the current overlay.
Canvas.prototype.hideOverlay = function() {
  if (this._currentOverlay === null) {
    throw new Error('hideOverlay called without a current overlay');
  }
  this._container.removeChild(this._currentOverlay.element());
  this._currentOverlay.hidden();
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

// showOverlay presents an overlay over the canvas.
// If another overlay was already showing, it will be hidden.
Canvas.prototype.showOverlay = function(overlay) {
  var e = overlay.element();
  e.style.position = 'absolute';
  e.style.left = '0';
  e.style.top = '0';
  e.style.width = '100%';
  e.style.height = '100%';
  this._container.appendChild(e);

  var oldOverlay = this._currentOverlay;
  this._currentOverlay = overlay;

  overlay.shown(this);

  // NOTE: we remove the old overlay after adding the new one to avoid any kind of flicker.
  if (oldOverlay !== null) {
    this._container.removeChild(oldOverlay.element());
    oldOverlay.hidden(this);
  }
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

function disableUserSelection(element) {
  element.style.webkitUserSelect = 'none';
  element.style.MozUserSelect = 'none';
  element.style.msUserSelect = 'none';
  element.style.userSelect = 'none';
}

exports.Canvas = Canvas;
