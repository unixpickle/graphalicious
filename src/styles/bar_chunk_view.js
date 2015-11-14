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

BarChunkView.prototype.deletion = function(oldIndex, animate) {
  this.finishAnimation();
  if (animate && this._attrs.getAnimateDeletion() && oldIndex >= this._startIndex
      oldIndex < this._startIndex + this._dataPoints.length) {
    this._animationInitialStartIndex = this._startIndex;
    this._animationInitialCount = this._dataPoints.length;
    this._animationPointIndex = oldIndex;
    this._animationDataPoint = this._dataPoints[oldIndex - this._startIndex];
    this._animationProgress = 0;
    this._animationStartTime = -1;
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
    this._animationType = BarChunkView.ANIMATION_DELETE;
  }
  if (oldIndex < this._startIndex) {
    --this._startIndex;
  } else if (oldIndex < this._startIndex+this._dataPoints.length) {
    this._dataPoints.splice(oldIndex-this._startIndex, 1, 0);
  }
  return this._animationType !== BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.insertion = function(index, animate) {
};

BarChunkView.prototype.modification = function(index, animate) {

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
