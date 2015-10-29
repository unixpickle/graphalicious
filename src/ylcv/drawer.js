// Drawer presents a particular ViewState in a 2D drawing context.
// It is also responsible for laying out the view's inline loaders.
function Drawer(topMargin, bottomMargin, canvas, context, state) {
  this._topMargin = topMargin;
  this._bottomMargin = bottomMargin;
  this._canvas = canvas;
  this._context = context;
  this._state = state;

  if (this._state.animating) {
    this._yLabelWidth = (1-this._state.animationProgress)*this._state.startYLabels.width() +
      this._state.animationProgress*this._state.yLabels.width();
    this._maxValue = (1-this._state.animationProgress)*this._state.startYLabels.maxValue() +
      this._state.animationProgress*this._state.yLabels.maxValue();
    this._chunkView = this._state.animatingChunkView;
  } else {
    this._yLabelWidth = this._state.yLabels.width();
    this._maxValue = this._state.yLabels.maxValue();
    this._chunkView = this._state.chunkView;
  }
}

Drawer.prototype.draw = function() {
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

  this._context.save();
  this._clipAwayYLabels();
  var chunkRegionOrNull = this._drawChunkView();
  if (chunkRegionOrNull !== null) {
    this._drawEdges(chunkRegionOrNull);
    // TODO: draw horizontal y-axis lines here.
  }
  this._context.restore();

  if (chunkRegionOrNull !== null) {
    this._drawYAxisLabels(chunkRegionOrNull);
  }
};

Drawer.prototype._drawChunkView = function() {
  var height = this._state.positive.viewportHeight - (this._topMargin + this._bottomMargin);
  var y = this._topMargin;

  if (this._shouldStretchContent()) {
    var width = this._state.positive.viewportWidth - this._state.liveLeftmostLabelWidth;
    return this._chunkView.drawStretched(this._state.liveLeftmostLabelWidth, y, width, height,
      this._maxValue, this._context);
  } else {
    var chunkLeftInCanvas = this._chunkView.getLeftOffset() + this._state.liveLeftmostLabelWidth -
      this._state.positive.viewportX;
    var chunkEndInCanvas = chunkLeftInCanvas + this._chunkView.getInherentWidth();

    if (chunkLeftInCanvas > this._state.positive.viewportWidth || chunkEndInCanvas < 0) {
      return null;
    }

    var regionLeft = Math.max(0, chunkLeftInCanvas) - chunkLeftInCanvas;
    var regionEnd = Math.min(this._state.positive.viewportWidth, chunkEndInCanvas) -
      chunkLeftInCanvas;
    var regionWidth = regionEnd - regionLeft;
    var canvasX = regionLeft + chunkLeftInCanvas;
    this._chunkView.draw(regionLeft, regionWidth, canvasX, y, height, this._maxValue,
      this._context);

    return {left: canvasX, width: regionWidth};
  }
};

Drawer.prototype._drawYAxisLabels = function(contentRect) {
  // As the content moves off-screen, the y-axis labels move off-screen with them.
  var labelOffset = 0;
  if (contentRect.left+contentRect.width < this._yLabelWidth-(JAGGED_EDGE_SIZE+JAGGED_LINE_WIDTH)) {
    labelOffset = this._yLabelWidth - (JAGGED_EDGE_SIZE+JAGGED_LINE_WIDTH) -
      (contentRect.left + contentRect.width);
  } else if (contentRect.left > this._state.positive.viewportWidth-this._yLabelWidth) {
    labelOffset = contentRect.left - (this._state.positive.viewportWidth - this._yLabelWidth);
  }

  if (!this._state.animating) {
    this._state.yLabels.draw(this._context, -labelOffset, this._topMargin,
      this._state.positive.viewportHeight-this._bottomMargin);
    return;
  }

  // TODO: draw animating labels here.
};

Drawer.prototype._drawEdges = function(contentRect) {
  // TODO: specifically ignore the right/left edge without needing to ignore both.
  if (this._chunkView.getLeftOffset() === 0 && this._chunkView.getRightOffset() === 0) {
    return;
  }

  for (var i = 0; i < 2; ++i) {
    var x = (i === 0 ? contentRect.left : contentRect.left+contentRect.width+JAGGED_EDGE_SIZE);
    if (x <= 0 || x >= this._state.positive.viewportWidth-2) {
      continue;
    }
    var startY = -(i === 0 ? 2 : 1)*JAGGED_EDGE_SIZE;

    this._context.beginPath();
    this._context.lineWidth = JAGGED_LINE_WIDTH;
    this._context.strokeStyle = JAGGED_COLOR;
    this._context.moveTo(x, 0);
    for (var y = startY; y < this._state.positive.viewportHeight; y += 2*JAGGED_EDGE_SIZE) {
      this._context.lineTo(x-JAGGED_EDGE_SIZE, y+JAGGED_EDGE_SIZE);
      this._context.lineTo(x, y+2*JAGGED_EDGE_SIZE);
    }
    this._context.stroke();
    this._context.closePath();
  }
};

Drawer.prototype._clipAwayYLabels = function() {
  this._context.beginPath();
  this._context.rect(this._yLabelWidth, 0, this._state.positive.viewportWidth-this._yLabelWidth,
    this._state.positive.viewportHeight);
  this._context.clip();
  this._context.closePath();
};

Drawer.prototype._shouldStretchContent = function() {
  return this._state.liveContentWidth + this._state.liveLeftmostLabelWidth <
    this._state.positive.viewportWidth;
};
