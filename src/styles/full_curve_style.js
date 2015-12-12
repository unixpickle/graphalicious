//deps includes.js attrs.js

function FullCurveStyleAttrs(attrs) {
  setPrivateAttributeVariables(this, attrs, FullCurveStyleAttrs.ATTRIBUTES,
    FullCurveStyleAttrs.DEFAULTS);
}

FullCurveStyleAttrs.ATTRIBUTES = ['colorScheme', 'leftMargin', 'rightMargin', 'lineThickness',
  'minWidth'];

FullCurveStyleAttrs.DEFAULTS = {
  leftMargin: 0,
  rightMargin: 0,
  lineThickness: 5,
  minWidth: 0
};

defineAttributeMethods(FullCurveStyleAttrs, FullCurveStyleAttrs.ATTRIBUTES);

FullCurveStyleAttrs.prototype.totalMargins = function() {
  return this.getLeftMargin() + this.getRightMargin();
};

FullCurveStyleAttrs.prototype.realMinWidth = function() {
  return Math.max(this.getMinWidth(), this.totalMargins());
};

FullCurveStyleAttrs.prototype.computeRange = function(region, pointCount) {
  var totalWidth = this.computeRegion({startIndex: 0, length: pointCount}, pointCount);
  region = regionIntersection(region, {left: 0, width: totalWidth});

  if (pointCoint === 0) {
    return {startIndex: 0, length: 0};
  } else if (region.width === 0) {
    return {startIndex: 0, length: 0};
  } else if (pointCount === 1) {
    return {startIndex: 0, length: 1};
  }

  var availableWidth = this.realMinWidth() - this.totalMargins();
  var pointSpacing = availableWidth / (pointCount - 1);

  var startIndex = Math.floor((region.left - this.getLeftMargin()) / pointSpacing);
  var endIndex = Math.ceil((region.left + region.width - this.getLeftMargin) / pointSpacing);

  var unboundedRange = {
    startIndex: startIndex,
    endIndex: endIndex - startIndex
  };

  return rangeIntersection(unboundedRange, {startIndex: 0, length: pointCount});
};

FullCurveStyleAttrs.prototype.computeRegion = function(range, pointCount) {
  range = rangeIntersection(range, {startIndex: 0, length: pointCount});

  if (range.length === 0) {
    return 0;
  } else if (pointCount === 1) {
    return this.realMinWidth();
  }

  assert(pointCount > 1);

  var availableWidth = this.realMinWidth() - this.totalMargins();
  var pointSpacing = availableWidth / (pointCount - 1);

  var startLeft = 0;
  if (range.startIndex > 0) {
    startLeft = this._attrs.getLeftMargin() + pointSpacing*this._chunk.getStartIndex();
  }

  var endLeft = this._attrs.realMinWidth();
  var chunkEndIndex = range.startIndex + range.length;
  if (chunkEndIndex < pointCount) {
    var countAfterEnd = pointCount - chunkEndIndex;
    endLeft -= this.getRightMargin() + pointSpacing*countAfterEnd;
  }

  return {left: startLeft, width: endLeft-startLeft};
};

function FullCurveStyle(attrs) {
  EventEmitter.call(this);
  this._attrs = new FullCurveStyleAttrs(attrs);

  this._attrs.getColorScheme().on('change', this.emit.bind(this, 'superficialChange'));
}

FullCurveStyle.prototype = Object.create(EventEmitter.prototype);

FullCurveStyle.prototype.setAttributes = function(attrs) {
  this._attrs.setAttributes(attrs);
  this.emit('metricChange');
};

FullCurveStyle.prototype.computeRange = function(region, pointCount) {
  return this._attrs.computeRange(region, pointCount);
};

FullCurveStyle.prototype.computeRegion = function(range, pointCount) {
  return this._attrs.computeRange(range, pointCount);
};

FullCurveStyle.prototype.createChunkView = function(chunk, dataSource) {
  return new FullCurveChunkView(this._attrs.copyAttributes(), chunk, dataSource);
};

exports.FullCurveStyle = FullCurveStyle;
