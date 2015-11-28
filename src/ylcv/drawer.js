var JAGGED_EDGE_SIZE = 5;
var JAGGED_LINE_WIDTH = 2;
var JAGGED_COLOR = '#f0f0f0';

var HORIZONTAL_LINE_COLOR = '#f0f0f0';
var HORIZONTAL_LINE_WIDTH = 2;

// Drawer presents a particular ViewState in a 2D drawing context.
// It is also responsible for laying out the view's inline loaders.
function Drawer(topMargin, bottomMargin, canvas, context, state) {
  this._topMargin = topMargin;
  this._bottomMargin = bottomMargin;
  this._canvas = canvas;
  this._context = context;
  this._state = state;

  this._chunkRegion = null;

  if (this._state.animating) {
    this._yLabelWidth = (1-this._state.animationProgress)*this._state.startYLabels.width() +
      this._state.animationProgress*this._state.yLabels.width();
    this._maxValue = (1-this._state.animationProgress)*this._state.startYLabels.maxValue() +
      this._state.animationProgress*this._state.yLabels.maxValue();
    this._chunkView = this._state.animationChunkView;
  } else {
    this._yLabelWidth = this._state.yLabels.width();
    this._maxValue = this._state.yLabels.maxValue();
    this._chunkView = this._state.chunkView;
  }
}

Drawer.prototype.draw = function() {
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

  var loaderFrames = [{left: 0, width: this._state.positive.viewportWidth}];

  this._context.save();
  this._clipAwayYLabels();
  var chunkRegion = this._drawChunkView();
  if (chunkRegion.width > 0) {
    loaderFrames = this._drawEdgesAndLines(chunkRegion);
  }
  this._context.restore();

  if (chunkRegion.width > 0) {
    var yWidth = this._drawYAxisLabels(chunkRegion);
    for (var i = 0; i < loaderFrames.length; ++i) {
      var frame = loaderFrames[i];
      if (frame.left < yWidth) {
        frame.width -= (yWidth - frame.left);
        frame.left = yWidth;
        if (frame.width < 0) {
          loaderFrames.splice(i, 1);
          --i;
        }
      }
    }
  }

  return loaderFrames;
};

Drawer.prototype._drawChunkView = function() {
  var viewport = {
    x: -JAGGED_EDGE_SIZE,
    y: this._topMargin,
    width: this._state.positive.viewportWidth + JAGGED_EDGE_SIZE*2,
    height: this._state.positive.viewportHeight - (this._topMargin + this._bottomMargin),
    context: this._context
  };
  return this._chunkView.draw(viewport, this._state.positive.viewportX -
    this._state.positive.leftmostYLabelsWidth, this._maxValue);
};

Drawer.prototype._drawEdgesAndLines = function(contentRect) {
  var leftX = -JAGGED_LINE_WIDTH;
  if (this._state.positive.visibleChunkStart > 0) {
    leftX = contentRect.left;
  }

  var rightX = this._state.positive.viewportWidth + JAGGED_LINE_WIDTH;
  if (this._state.positive.visibleChunkStart + this._state.positive.visibleChunkLength <
      this._state.positive.dataSourceLength) {
    var suggestedValue = contentRect.left+contentRect.width;
    if (suggestedValue < this._state.positive.viewportWidth-JAGGED_LINE_WIDTH) {
      rightX = suggestedValue;
    }
  }

  this._context.save();

  this._context.lineWidth = JAGGED_LINE_WIDTH;
  this._context.strokeStyle = JAGGED_COLOR;
  this._context.beginPath();
  this._drawEdge(leftX, true);
  this._drawEdge(rightX, false);
  this._context.closePath();
  this._context.stroke();
  this._context.clip();

  if (this._state.animating) {
    this._drawHorizontalLines(this._state.startYLabels, 1-this._state.animationProgress);
    this._drawHorizontalLines(this._state.yLabels, this._state.animationProgress);
  } else {
    this._drawHorizontalLines(this._state.yLabels, 1);
  }

  this._context.restore();

  var loaders = [];
  if (leftX - JAGGED_EDGE_SIZE > 0) {
    var width = Math.min(leftX-JAGGED_EDGE_SIZE, this._state.positive.viewportWidth);
    loaders.push({left: 0, width: width});
  }
  if (rightX + JAGGED_EDGE_SIZE < this._state.positive.viewportWidth) {
    var left = Math.max(rightX + JAGGED_EDGE_SIZE, 0);
    loaders.push({left: left, width: this._state.positive.viewportWidth - left});
  }
  return loaders;
};

Drawer.prototype._drawEdge = function(x, leftSide) {
  var topY = -JAGGED_EDGE_SIZE;
  var bottomY = this._state.positive.viewportHeight + JAGGED_LINE_WIDTH;

  assert(topY <= bottomY);

  if (leftSide) {
    this._context.moveTo(x, topY);
    for (var y = topY; y <= bottomY; y += 2*JAGGED_EDGE_SIZE) {
      this._context.lineTo(x-JAGGED_EDGE_SIZE, y+JAGGED_EDGE_SIZE);
      this._context.lineTo(x, y+2*JAGGED_EDGE_SIZE);
    }
  } else {
    this._context.lineTo(x, bottomY);
    for (var y = bottomY; y >= topY; y -= 2*JAGGED_EDGE_SIZE) {
      this._context.lineTo(x+JAGGED_EDGE_SIZE, y-JAGGED_EDGE_SIZE);
      this._context.lineTo(x, y-2*JAGGED_EDGE_SIZE);
    }
  }
};

Drawer.prototype._drawHorizontalLines = function(labels, opacity) {
  var count = labels.values.length;
  var maxHeight = this._state.positive.viewportHeight - (this._bottomMargin + this._topMargin);
  var height = maxHeight * (labels.maxValue() / this._maxValue);

  var oldAlpha = this._context.globalAlpha;
  this._context.globalAlpha = opacity;
  var oldComp = this._context.globalCompositeOperation;
  this._context.globalCompositeOperation = 'destination-over';

  this._context.strokeStyle = HORIZONTAL_LINE_COLOR;
  this._context.lineThickness = HORIZONTAL_LINE_WIDTH;

  this._context.beginPath();
  var bottomY = this._state.positive.viewportHeight - this._bottomMargin;
  var divisionHeight = height / (count - 1);
  for (var i = 0; i < count; ++i) {
    var y = Math.round(bottomY - i*divisionHeight);
    this._context.moveTo(0, y);
    this._context.lineTo(this._state.positive.viewportWidth, y);
  }
  this._context.stroke();
  this._context.closePath();

  this._context.globalAlpha = oldAlpha;
  this._context.globalCompositeOperation = oldComp;
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

  var maxHeight = this._state.positive.viewportHeight - (this._bottomMargin + this._topMargin);
  var bottom = this._state.positive.viewportHeight - this._bottomMargin;

  if (this._state.animating) {
    this._context.globalAlpha = this._state.animationProgress;
    var newLabelsHeight = maxHeight * (this._state.yLabels.maxValue() / this._maxValue);
    this._state.yLabels.draw(this._context, -labelOffset, bottom-newLabelsHeight, bottom);

    this._context.globalAlpha = 1-this._state.animationProgress;
    var oldLabelsHeight = maxHeight * (this._state.startYLabels.maxValue() / this._maxValue);
    this._state.startYLabels.draw(this._context, -labelOffset, bottom-oldLabelsHeight, bottom);

    this._context.globalAlpha = 1;
  } else {
    this._state.yLabels.draw(this._context, -labelOffset, bottom-maxHeight, bottom);
  }

  return this._yLabelWidth - labelOffset;
};

Drawer.prototype._clipAwayYLabels = function() {
  this._context.beginPath();
  this._context.rect(this._yLabelWidth, 0, this._state.positive.viewportWidth-this._yLabelWidth,
    this._state.positive.viewportHeight);
  this._context.clip();
  this._context.closePath();
};
