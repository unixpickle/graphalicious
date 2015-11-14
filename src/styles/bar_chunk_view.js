//deps includes.js

function BarChunkView(attrs, chunk, dataSource) {
  this._attrs = attrs;
  this._chunk = chunk;
  this._pointCount = dataSource.getLength();
  
  this._animationFrame = null;
  this._animationProgress = 0;
  this._animationType = BarChunkView.ANIMATION_NONE;
  this._animationDataPoint = null;
  this._animationPointIndex = 0;
}

BarChunkView.ANIMATION_NONE = 0;
BarChunkView.ANIMATION_DELETE = 1;
BarChunkView.ANIMATION_INSERT = 2;
BarChunkView.ANIMATION_MODIFY = 3;

BarChunkView.prototype.getWidth = function() {
  var totalWidth = this._attrs.computeRegion({startIndex: 0, length: this._pointCount},
    this._pointCount).width;
  switch (this._animationType) {
  case BarChunkView.ANIMATION_MODIFY:
  case BarChunkView.ANIMATION_NONE:
    return totalWidth;
  case BarChunkView.ANIMATION_DELETE:
    var oldTotalWidth = this._attrs.computeRegion({startIndex: 0, length: this._pointCount+1},
      this._pointCount+1).width;
    return totalWidth*this._animationProgress + oldTotalWidth*(1-this._animationProgress);
  case BarChunkView.ANIMATION_INSERT:
    assert(this._pointCount > 0);
    var oldTotalWidth = this._attrs.computeRegion({startIndex: 0, length: this._pointCount-1},
      this._pointCount-1).width;
    return totalWidth*this._animationProgress + oldTotalWidth*(1-this._animationProgress);
  default:
    throw new Error('invalid animation type: ' + this._animationType);
  }
};
