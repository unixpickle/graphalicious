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

DummyContext.prototype.rect = function(x, y, width, height) {
};

DummyContext.prototype.clip = function() {
};

DummyContext.prototype.save = function() {
};

DummyContext.prototype.restore = function() {
};

DummyContext.prototype.scale = function(x, y) {
};

DummyContext.prototype.translate = function(x, y) {
};

DummyContext.prototype.beginPath = function() {
};

DummyContext.prototype.moveTo = function(x, y) {
};

DummyContext.prototype.lineTo = function(x, y) {
};

DummyContext.prototype.stroke = function() {
};

DummyContext.prototype.closePath = function() {
};

module.exports = DummyCanvas;
