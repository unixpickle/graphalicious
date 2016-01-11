function FullCurveXMarkers(attrs) {
  this._startX = attrs.startX;
  this._spacing = attrs.spacing;
  this._length = attrs.length;
}

FullCurveXMarkers.prototype.getLength = function() {
  return this._length;
};

FullCurveXMarkers.prototype.computeRange = function(canvasRegion) {
  var startIndex = Math.ceil((canvasRegion.left - this._startX) / this._spacing);
  var endIndex = Math.floor((canvasRegion.left + canvasRegion.width - this._startX) /
    this._spacing);

  startIndex = Math.max(0, Math.min(this._length-1, startIndex));
  endIndex = Math.max(0, Math.min(this._length-1, endIndex));

  if (startIndex > endIndex) {
    return {startIndex: 0, length: 0};
  }

  return {startIndex: startIndex, length: endIndex - startIndex + 1};
};

FullCurveXMarkers.prototype.getXMarker = function(index) {
  return {
    index: index,
    oldIndex: index,
    animationProgress: -1,
    oldDataPoint: null,
    x: this._startX + index*this._spacing
  };
};
