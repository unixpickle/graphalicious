function SplineGraph() {
  this._points = [];
  this._secondary = [];
  seed(122);
  for (var i = 0; i < 100; ++i) {
    this._points.push(random());
    this._secondary.push(this._points[i] / 2);
  }
}

SplineGraph.prototype.resize = function() {
  var state = new window.scrollerjs.State(this._totalWidth(), this._viewportSize().width,
    this._totalWidth());
  scrollView.setState(state);
  this.draw();
};

SplineGraph.prototype.scroll = function() {
  this.draw();
};

SplineGraph.prototype.mouse = function() {
  this.draw();
};

SplineGraph.prototype.draw = function() {
  var offset = scrollView.getState().getScrolledPixels();
  var viewport = this._viewportSize();

  drawingContext.clearRect(0, 0, viewport.width, viewport.height);

  var primaryPoints = [];
  var secondaryPoints = [];

  for (var i = 0, len = this._points.length; i < len; ++i) {
    var x = 10 + 50*i - offset;
    if (x >= -50 && x <= viewport.width+50) {
      var height = this._points[i]*(viewport.height-15) + 5;
      primaryPoints.push({x: x + 5, y: viewport.height-height});
      height = this._secondary[i]*(viewport.height-15) + 5;
      secondaryPoints.push({x: x + 5, y: viewport.height-height});
    }
  }

  var smoothPrimary = smoothPath(primaryPoints, 1);
  drawingContext.strokeStyle = '#65bcd4';
  drawingContext.lineWidth = 3;
  drawingContext.beginPath();
  for (var i = 0, len = smoothPrimary.length; i < len; ++i) {
    var p = smoothPrimary[i];
    if (i === 0) {
      drawingContext.moveTo(p.x, p.y);
    } else {
      drawingContext.lineTo(p.x, p.y);
    }
  }
  drawingContext.stroke();

  var smoothSecondary = smoothPath(secondaryPoints, 1);
  drawingContext.strokeStyle = '#216578';
  drawingContext.lineWidth = 3;
  drawingContext.beginPath();
  for (var i = 0, len = smoothSecondary.length; i < len; ++i) {
    var p = smoothSecondary[i];
    if (i === 0) {
      drawingContext.moveTo(p.x, p.y);
    } else {
      drawingContext.lineTo(p.x, p.y);
    }
  }
  drawingContext.stroke();

  drawingContext.strokeStyle = 'white';
  drawingContext.lineWidth = 2;

  for (var i = 0, len = primaryPoints.length; i < len; ++i) {
    var point = primaryPoints[i];
    drawingContext.fillStyle = '#65bcd4';
    drawingContext.beginPath();
    drawingContext.arc(point.x, point.y, 5, 0, Math.PI*2);
    drawingContext.fill();
    drawingContext.stroke();
  }

  for (var i = 0, len = secondaryPoints.length; i < len; ++i) {
    var point = secondaryPoints[i];
    drawingContext.fillStyle = '#216578';
    drawingContext.beginPath();
    drawingContext.arc(point.x, point.y, 5, 0, Math.PI*2);
    drawingContext.fill();
    drawingContext.stroke();
  }
};

SplineGraph.prototype._viewportSize = function() {
  return {
    width: mainCanvas.offsetWidth,
    height: mainCanvas.offsetHeight
  };
};

SplineGraph.prototype._totalWidth = function() {
  return 20 + this._points.length*50 - 40;
};
