//deps includes.js

function BarChunkView(attrs, chunk, dataSource) {
  this._attrs = attrs;
  this._chunk = chunk;

  this._encompassingCount = dataSource.getLength();
  this._dataPoints = [];
  this._startIndex = chunk.getStartIndex();
  for (var i = 0, len = chunk.getLength(); i < len; ++i) {
    this._dataPoints.push(chunk.getDataPoint(i));
  }

  this._animationFrame = null;
  this._animationProgress = 0;
  this._animationType = BarChunkView.ANIMATION_NONE;
  this._animationDataPoint = null;
  this._animationPointIndex = 0;
  this._animationInitialStartIndex = 0;
  this._animationInitialCount = 0;
}

BarChunkView.ANIMATION_NONE = 0;
BarChunkView.ANIMATION_DELETE = 1;
BarChunkView.ANIMATION_INSERT = 2;
BarChunkView.ANIMATION_MODIFY = 3;

BarChunkView.prototype.getWidth = function() {
  var width = this._attrs.computeRegion({startIndex: 0, length: this._dataPoints.length},
    this._dataPoints.length).width;
  var oldWidth = this._attrs.computeRegion({startIndex: 0, length: this._animationInitialCount},
    this._animationInitialCount).width;
  return this._animationProgress*width + (1-this._animationProgress)*oldWidth;
};

BarChunkView.prototype.getOffset = function() {
  var left = this._attrs.computeRegion({startIndex: this._startIndex, length: 0}).left;

  if (this._animationType === BarChunkView.ANIMATION_NONE) {
    return left;
  }

  var oldLeft = this._attrs.computeRegion({
    startIndex: this._animationInitialStartIndex,
    length: 0
  }).left;

  return left*this._animationProgress + oldLeft*(1-this._animationProgress);
};

BarChunkView.prototype.getEncompassingWidth = function() {
  var initialCount = this._encompassingCount;
  if (this._animationType === BarChunkView.ANIMATION_DELETE) {
    --initialCount;
  } else if (this._animationType === BarChunkView.ANIMATION_INSERT) {
    ++initialCount;
  }

  var width = this._attrs.computeRegion({startIndex: 0, length: this._encompassingCount},
    this._encompassingCount).width;
  var oldWidth = this._attrs.computeRegion({startIndex: 0, length: initialCount},
    initialCount).width;
  return this._animationProgress*width + (1-this._animationProgress)*oldWidth;
};
