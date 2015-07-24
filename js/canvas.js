// A GraphCanvas is used for drawing the contents of a graphalicious graph.
//
// GraphCanvas implements the EventEmitter protocol. It emits "layout" events
// whenever it is laid out.
function GraphCanvas() {
  this._canvas = document.createElement('canvas');

  this._ratio = window.crystal.getRatio();
  this._boundCrystalCallback = this._crystalCallback.bind(this);
  window.crystal.addListener(this._boundCrystalCallback);
}

GraphCanvas.prototype = Object.create(EventEmitter.prototype);

// dispose removes any callbacks which the GraphCanvas is registered for.
// You should call this when you are done using a GraphCanvas.
GraphCanvas.prototype.dispose = function() {
  window.crystal.removeListener(this._boundCrystalCallback);
};

// element returns the DOM element for the GraphCanvas.
GraphCanvas.prototype.element = function() {
  return this._canvas;
};

// height returns the height of the canvas in CSS pixels.
GraphCanvas.prototype.height = function() {
  return this._element.offsetHeight;
};

// layout re-draws the contents of the canvas.
// You should call this whenever the canvas changes size.
GraphCanvas.prototype.layout = function() {
  this._canvas.width = this.width() * this._ratio;
  this._canvas.height = this.height() * this._ratio;
  this.emit('layout');
};

// pixelRatio returns the ratio between canvas pixels and CSS pixels.
GraphCanvas.prototype.pixelRatio = function() {
  return this._ratio;
};

// width returns the width of the canvas in CSS pixels.
GraphCanvas.prototype.width = function() {
  return this._element.offsetWidth;
};

GraphCanvas.prototype._crystalCallback = function() {
  this._ratio = Math.ceil(window.crystal.getRatio());
  this.layout();
};
