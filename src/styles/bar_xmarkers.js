function BarXMarkers(info) {
  this._landscape = info.drawParams.landscape.copy();
  this._drawOffset = info.drawParams.drawOffset;
  this._stretchFactor = info.drawParams.stretchFactor;
  this._viewportX = info.drawParams.viewport.x;
  this._animationType = info.animationType;
  this._animationPointIndex = info.animationPointIndex;
  this._animationOldPoint = info.animationOldPoint;
  this._animationProgress = info.animationProgress;
}

BarXMarkers.prototype.getLength = function() {
  return this._landscape.getPointCount();
};

BarXMarkers.prototype.computeRange = function(canvasRegion) {
  throw new Error('not yet implemented');
};

BarXMarkers.prototype.getXMarker = function(index) {
  throw new Error('not yet implemented');
};
