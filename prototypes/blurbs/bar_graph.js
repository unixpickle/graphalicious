function BarGraph() {
  this._points = [];
  this._secondary = [];
  for (var i = 0; i < 100; ++i) {
    this._points.push(Math.random());
    this._secondary.push(this._points[i] / 2);
  }
}

BarGraph.prototype.resize = function() {
  var state = new window.scrollerjs.State(this._totalWidth(), this._viewportSize().width,
    this._totalWidth());
  scrollView.setState(state);
  this.draw();
};

BarGraph.prototype.scroll = function() {
  this.draw();
};

BarGraph.prototype.mouse = function() {
  this.draw();
};

BarGraph.prototype.draw = function() {
  var offset = scrollView.getState().getScrolledPixels();
  var viewport = this._viewportSize();

  drawingContext.clearRect(0, 0, viewport.width, viewport.height);

  for (var i = 0, len = this._points.length; i < len; ++i) {
    var x = 10 + 45*i - offset;
    var height = this._points[i] * (viewport.height - 10);

    drawingContext.fillStyle = '#65bcd4';
    drawingContext.fillRect(x, viewport.height-height, 40, height);

    height = this._secondary[i] * (viewport.height - 10);
    drawingContext.fillStyle = '#216578';
    drawingContext.fillRect(x, viewport.height-height, 40, height);
  }
};

BarGraph.prototype._viewportSize = function() {
  return {
    width: mainCanvas.offsetWidth,
    height: mainCanvas.offsetHeight
  };
};

BarGraph.prototype._totalWidth = function() {
  return 20 + this._points.length*45 - 5;
};
