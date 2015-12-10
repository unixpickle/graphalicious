//deps bar_style.js

function DotStyleAttrs(attrs) {
  setPrivateAttributeVariables(this, attrs, DotStyleAttrs.ATTRIBUTES,
    DotStyleAttrs.DEFAULTS);
}

DotStyleAttrs.ATTRIBUTES = ['bottomMargin', 'dotStrokeWidth', 'dotStrokeColor',
  'improperDotStrokeWidth', 'improperDotHoleColor'];

DotStyleAttrs.DEFAULTS = {
  bottomMargin: 0,
  dotStrokeWidth: 0,
  dotStrokeColor: 'white',
  improperDotStrokeWidth: 2,
  improperDotHoleColor: 'white'
};

defineAttributeMethods(DotStyleAttrs, DotStyleAttrs.ATTRIBUTES);

function DotStyle(attrs) {
  BarStyle.call(this, dotAttrsToBarAttrs(attrs));
  this._dotAttrs = new DotStyleAttrs(attrs);
}

DotStyle.prototype = Object.create(BarStyle.prototype);

DotStyle.prototype.setAttributes = function(attrs) {
  this._dotAttrs.setAttributes(attrs);
  BarStyle.prototype.setAttributes.call(this, dotAttrsToBarAttrs(attrs));
};

DotStyle.prototype.createChunkView = function(chunk, dataSource) {
  return new DotChunkView(this._dotAttrs.copyAttributes(), this.copyAttributes(), chunk,
    dataSource);
};

function dotAttrsToBarAttrs(attrs) {
  var barAttrs = {};
  var keys = Object.keys(attrs);
  var keyChanges = {dotSize: 'barWidth', dotSpacing: 'barSpacing'};
  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i];
    if (key === 'barWidth' || key === 'barSpacing') {
      continue;
    }
    barAttrs[keyChanges[key] || key] = attrs[key];
  }
  return barAttrs;
}

exports.DotStyle = DotStyle;
