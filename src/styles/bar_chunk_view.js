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
  this._animationStartTime = -1;
  this._animationType = BarChunkView.ANIMATION_NONE;
  this._animationDataPoint = null;
  this._animationOriginalPoint = null;
  this._animationPointIndex = 0;
  this._animationInitialStartIndex = 0;
  this._animationInitialCount = 0;
}

BarChunkView.ANIMATION_NONE = 0;
BarChunkView.ANIMATION_DELETE = 1;
BarChunkView.ANIMATION_INSERT = 2;
BarChunkView.ANIMATION_MODIFY = 3;

BarChunkView.ANIMATION_DURATION = 400;

BarChunkView.prototype.getWidth = function() {
  var width = this._attrs.computeRegion({startIndex: 0, length: this._dataPoints.length},
    this._dataPoints.length).width;
  var oldWidth = this._attrs.computeRegion({startIndex: 0, length: this._animationInitialCount},
    this._animationInitialCount).width;
  return this._animationProgress*width + (1-this._animationProgress)*oldWidth;
};

BarChunkView.prototype.getOffset = function() {
  var region = this._morphingLandscape().computeRegion({startIndex: this._startIndex, 1});
  return region.left;
};

BarChunkView.prototype.getEncompassingWidth = function() {
  return this._morphingLandscape().width();
};

BarChunkView.prototype.deletion = function(oldIndex, animate) {
  assert(this._encompassingCount > 0);
  --this._encompassingCount;

  this.finishAnimation();
  if (animate && this._attrs.getAnimateDeletions() &&
      this._chunk.getLength() !== this._dataPoints.length &&
      this._dataPoints.length !== 1) {
    this._startAnimation(oldIndex, BarChunkView.ANIMATION_DELETE,
      this._dataPoints[oldIndex - this._startIndex]);
  }

  if (oldIndex < this._startIndex) {
    --this._startIndex;
  } else if (oldIndex < this._startIndex+this._dataPoints.length) {
    this._dataPoints.splice(oldIndex-this._startIndex, 1);
  }

  return this._animationType !== BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.insertion = function(index, animate) {
  ++this._encompassingCount;

  var point = this._chunk.getDataPoint(index);

  this.finishAnimation();
  if (animate && this._attrs.getAnimateInsertions() &&
      this._chunk.getLength() !== this._dataPoints.length &&
      this._dataPoints.length !== 0) {
    this._startAnimation(index, BarChunkView.ANIMATION_INSERT, point);
  }

  if (this._chunk.getLength() > this._dataPoints.length) {
    this._dataPoints.splice(index-this._startIndex, 0, point);
  } else if (index < this._startIndex) {
    ++this._startIndex;
  }

  return this._animationType !== BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.modification = function(index, animate) {
  if (index < this._startIndex || index >= this._startIndex+this._dataPoints.length) {
    return false;
  }

  var point = this._chunk.getDataPoint(index);
  this.finishAnimation();
  if (animate && this._attrs.getAnimateModifications()) {
    this._startAnimation(index, BarChunkView.ANIMATION_MODIFY, point);
  }

  this._animationOriginalPoint = this._dataPoints[index - this._startIndex];
  this._dataPoints[index - this._startIndex] = point;

  return this._animationType !== BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.finishAnimation = function() {
  if (this._animationFrame !== null) {
    window.cancelAnimationFrame(this._animationFrame);
    this._animationFrame = null;
    this._animationType = BarChunkView.ANIMATION_NONE;
  }
};

BarChunkView.prototype._animate = function(time) {
  if (this._animationStartTime < 0) {
    this._animationStartTime = time;
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
    return;
  }

  var elapsed = (time - this._animationStartTime) / BarChunkView.ANIMATION_DURATION;
  if (elapsed >= 1) {
    elapsed = 1;
  }
  this._animationProgress = elapsed;
  if (elapsed === 1) {
    this.finishAnimation();
    this.emit('animationFrame', 1);
    this.emit('animationEnd');
  } else {
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
    this.emit('animationFrame', elapsed);
  }
};

BarChunkView.prototype._startAnimation = function(index, type, point) {
  this._animationInitialStartIndex = this._startIndex;
  this._animationInitialCount = this._dataPoints.length;
  this._animationPointIndex = index;
  this._animationDataPoint = point;
  this._animaitonOriginalPoint = null;
  this._animationProgress = 0;
  this._animationStartTime = -1;
  this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  this._animationType = type;
};

BarChunkView.prototype._morphingLandscape = function() {
  var properties = {
    attrs: this._attrs,
    pointCount: this._pointCount,
    morphingIndex: this._animationPointIndex,
    morphingVisibility: this._animationProgress
  };

  switch (this._animationType) {
  case BarChunkView.ANIMATION_DELETE:
    properites.pointCount += 1;
  case BarChunkView.ANIMATION_INSERT:
    break;
  default:
    properties.morphingVisibility = 1;
    properties.morphingIndex = 0;
    break;
  }

  return new MorphingBarLandscape(properties);
};
