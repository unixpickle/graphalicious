function DummyCanvas() {
  this._context = new DummyContext();
}

DummyCanvas.prototype.getContext = function() {
  return this._context;
};

function DummyContext() {
  this.fillColor = 'black';
}

DummyContext.prototype.fillRect = function(x, y, width, height) {
};

module.exports = DummyCanvas;
