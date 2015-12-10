//deps includes.js attrs.js

function FullCurveStyleAttrs(attrs) {
  setPrivateAttributeVariables(this, attrs, FullCurveStyleAttrs.ATTRIBUTES,
    FullCurveStyleAttrs.DEFAULTS);
}

FullCurveStyleAttrs.ATTRIBUTES = ['colorScheme', 'leftMargin', 'rightMargin', 'lineThickness'];

FullCurveStyleAttrs.DEFAULTS = {
  leftMargin: 0,
  rightMargin: 0,
  lineThickness: 5
};

defineAttributeMethods(FullCurveStyleAttrs, FullCurveStyleAttrs.ATTRIBUTES);

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
  return {startIndex: 0, length: pointCount};
};

FullCurveStyle.prototype.computeRegion = function(range, pointCount) {
  return {left: 0, width: 0};
};

FullCurveStyle.prototype.createChunkView = function(chunk, dataSource) {
  return new FullCurveChunkView(this._attrs.copyAttributes(), chunk, dataSource);
};

exports.FullCurveStyle = FullCurveStyle;
