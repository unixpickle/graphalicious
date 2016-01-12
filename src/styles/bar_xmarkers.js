function BarXMarkers(info) {
  this._drawParams = info.drawParams;
  this._animationType = info.animationType;
  this._animationPointIndex = info.animationPointIndex;
  this._animationOldPoint = info.animationOldPoint;
  this._animationProgress = info.animationProgress;
}

BarXMarkers.prototype.getLength = function() {
  return this._drawParams.getLandscape().getPointCount();
};

BarXMarkers.prototype.computeRange = function(canvasRegion) {
  var region = this._drawParams.canvasRegionToRegion(canvasRegion);
  var range = this._drawParams.getLandscape().computeRange(region);

  // An x marker for the point before/after the region may be visible,
  // since x markers might be beside their corresponding bars.
  var startIndex = Math.max(0, range.startIndex-1);
  var endIndex = Math.min(this.getLength()-1, range.startIndex+range.length);

  for (; startIndex <= endIndex; ++startIndex) {
    if (this._computeXMarkerX(startIndex) >= canvasRegion.left) {
      break;
    }
  }
  for (; endIndex >= startIndex; --endIndex) {
    if (this._computeXMarkerX(endIndex) < canvasRegion.left+canvasRegion.width) {
      break;
    }
  }

  if (endIndex < startIndex) {
    return {startIndex: 0, length: 0};
  }

  return {startIndex: startIndex, length: endIndex - startIndex + 1};
};

BarXMarkers.prototype.getXMarker = function(index) {
  var result = this._computeXMarkerData(index);
  result.x = this._computeXMarkerX(index);
  return result;
};

BarXMarkers.prototype._computeXMarkerData = function(index) {
  var result = {
    index: index,
    oldIndex: index,
    oldDataPoint: null,
    animationProgress: -1,
  };

  if (this._animationType === BarChunkView.ANIMATION_NONE ||
      index < this._animationPointIndex) {
    return result;
  }

  if (index === this._animationPointIndex) {
    result.animationProgress = this._animationProgress;
    result.oldDataPoint = this._animationOldPoint;
  }

  switch (this._animationType) {
  case BarChunkView.ANIMATION_DELETE:
    if (index === this._animationPointIndex) {
      result.index = -1;
    } else {
      --result.index;
    }
    break;
  case BarChunkView.ANIMATION_INSERT:
    if (index === this._animationPointIndex) {
      result.oldIndex = -1;
    } else {
      --result.oldIndex;
    }
    break;
  }

  return result;
};

BarXMarkers.prototype._computeXMarkerX = function(index) {
  var landscape = this._drawParams.getLandscape();
  var barCoords = landscape.computeBarRegion(index);
  var barRegion = landscape.computeRegion({startIndex: index, length: 1});

  var landscapeX;
  switch (this._drawParams.getLandscape().getAttributes().getXLabelAlignment()) {
  case BarStyleAttrs.X_LABELS_CENTER:
    landscapeX = barCoords.left + barCoords.width/2;
    break;
  case BarStyleAttrs.X_LABELS_RIGHT:
    landscapeX = (barCoords.left + barCoords.width + barRegion.left + barRegion.width) / 2;
    break;
  case BarStyleAttrs.X_LABELS_LEFT:
    landscapeX = (barCoords.left + barRegion.left) / 2;
    break;
  default:
    throw new Error('unknown x-label alignment:' + this._attrs.getXLabelAlignment());
  }

  return this._drawParams.landscapeXToCanvasX(landscapeX);
};
