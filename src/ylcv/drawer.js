// Drawer presents a particular ViewState in a 2D drawing context.
// It is also responsible for laying out the view's inline loaders.
function Drawer(topMargin, bottomMargin, canvas, context, state) {
  this._topMargin = topMargin;
  this._bottomMargin = bottomMargin;
  this._canvas = canvas;
  this._context = context;
  this._state = state;
}

Drawer.prototype.draw = function() {
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

  var yLabelWidth;
  if (this._state.animating) {
    yLabelWidth = (1-this._state.animationProgress)*this._state.startYLabels.width() +
      this._state.animationProgress*this._state.yLabels.width();
  } else {
    yLabelWidth = this._state.yLabels.width();
  }

  this._context.save();
  this._context.beginPath();
  this._context.rect(yLabelWidth, 0, this._state.positive.viewportWidth-yLabelWidth,
    this._state.positive.viewportHeight);
  this._context.clip();
  this._context.closePath();

  var chunkRegionOrNull = this._drawChunkView();
  if (chunkRegionOrNull !== null) {
    this._drawEdges(chunkRegionOrNull, yLabelWidth);
    // TODO: draw horizontal y-axis lines here.
  }

  this._context.restore();

  if (chunkRegionOrNull !== null) {
    this._drawYAxisLabels(chunkRegionOrNull, yLabelWidth);
  }
};

Drawer.prototype._drawChunkView = function() {
  var chunkView;
  var maxValue;
  if (this._state.animating) {
    maxValue = (1-this._state.animationProgress)*this._state.startYLabels.maxValue() +
      this._state.animationProgress*this._state.yLabels.maxValue();
    chunkView = this._state.animatingChunkView;
  } else {
    maxValue = this._state.yLabels.maxValue();
    chunkView = this._state.chunkView;
  }

  var height = this._state.positive.viewportHeight - (this._topMargin + this._bottomMargin);
  var y = this._topMargin;

  if (this._shouldStretchContent()) {
    var width = this._state.positive.viewportWidth - this._state.liveLeftmostLabelWidth;
    return chunkView.drawStretched(this._state.liveLeftmostLabelWidth, y, width, height, maxValue,
      this._context);
  } else {
    var chunkLeftInCanvas = chunkView.getLeftOffset() + this._state.liveLeftmostLabelWidth -
      this._state.positive.viewportX;
    var chunkEndInCanvas = chunkLeftInCanvas + this._state.chunkView.getInherentWidth();

    if (chunkLeftInCanvas > this._state.positive.viewportWidth || chunkEndInCanvas < 0) {
      return null;
    }

    var regionLeft = Math.max(0, chunkLeftInCanvas) - chunkLeftInCanvas;
    var regionEnd = Math.min(this._state.positive.viewportWidth, chunkEndInCanvas) -
      chunkLeftInCanvas;
    var regionWidth = regionEnd - regionLeft;
    var canvasX = regionLeft + chunkLeftInCanvas;
    chunkView.draw(regionLeft, regionWidth, canvasX, y, height, maxValue, this._context);

    return {left: canvasX, width: regionWidth};
  }
};

Drawer.prototype._drawYAxisLabels = function(contentRect, yLabelWidth) {
  var labelOffset = 0;
  if (contentRect.left+contentRect.width < yLabelWidth-(JAGGED_EDGE_SIZE+JAGGED_LINE_WIDTH)) {
    labelOffset = yLabelWidth - (JAGGED_EDGE_SIZE+JAGGED_LINE_WIDTH) -
      (contentRect.left + contentRect.width);
  } else if (contentRect.left > this._state.positive.viewportWidth-yLabelWidth) {
    labelOffset = contentRect.left - (this._state.positive.viewportWidth - yLabelWidth);
  }

  if (!this._state.animating) {
    this._state.yLabels.draw(this._context, -labelOffset, this._topMargin,
      this._state.positive.viewportHeight-this._bottomMargin);
    return;
  }

  var maxValue;
  maxValue = (1-this._state.animationProgress)*this._state.startYLabels.maxValue() +
    this._state.animationProgress*this._state.yLabels.maxValue();
  // TODO: draw animating labels here.
};

Drawer.prototype._drawEdges = function(contentRect, yLabelsWidth) {
  var chunkView;
  if (this._state.animating) {
    chunkView = this._state.animatingChunkView;
  } else {
    chunkView = this._state.chunkView;
  }
  if (chunkView.getLeftOffset() === 0 && chunkView.getRightOffset() === 0) {
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

Drawer.prototype._shouldStretchContent = function() {
  return this._state.liveContentWidth + this._state.liveLeftmostLabelWidth <
    this._state.positive.viewportWidth;
};
