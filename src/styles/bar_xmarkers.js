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
  var result = this._computeXMarkerData(index);

  var barCoords = this._landscape.computeBarRegion(index);
  var barRegion = this._landscape.computeRegion({startIndex: index, length: 1});
  switch (this._landscape.getAttributes().getXLabelAlignment()) {
  case BarStyleAttrs.X_LABELS_CENTER:
    result.x = barCoords.left + barCoords.width/2;
    break;
  case BarStyleAttrs.X_LABELS_RIGHT:
    result.x = (barCoords.left + barCoords.width + barRegion.left + barRegion.width) / 2;
    break;
  case BarStyleAttrs.X_LABELS_LEFT:
    result.x = (barCoords.left + barRegion.left) / 2;
    break;
  default:
    throw new Error('unknown x-label alignment:' + this._attrs.getXLabelAlignment());
  }

  result.x += this._drawOffset;
  result.x = (result.x-this._viewportX)*this._stretchFactor + this._viewportX;

  return result;
};

BarXMarkers.prototype._computeXMarkerData = function(index) {
  var result = {
    index: idx,
    oldIndex: idx,
    oldDataPoint: null,
    animationProgress: -1,
  };

  if (this._animationType === BarChunkView.ANIMATION_NONE ||
      idx < this._animationPointIndex) {
    return result;
  }

  if (idx === this._animationPointIndex) {
    result.animationProgress = this._animationProgress;
    result.oldDataPoint = this._animationOldPoint;
  }

  switch (this._animationType) {
  case BarChunkView.ANIMATION_DELETE:
    if (idx === this._animationPointIndex) {
      result.index = -1;
    } else {
      --result.index;
    }
    break;
  case BarChunkView.ANIMATION_INSERT:
    if (idx === this._animationPointIndex) {
      result.oldIndex = -1;
    } else {
      --result.oldIndex;
    }
    break;
  }

  return result;
};
