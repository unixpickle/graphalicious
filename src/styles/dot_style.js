//deps bar_style.js

function DotStyle(attrs) {
  BarStyle.call(this, dotAttrsToBarAttrs(attrs));
}

DotStyle.prototype = Object.create(BarStyle.prototype);

DotStyle.prototype.setAttributes = function(attrs) {
  BarStyle.prototype.setAttributes.call(this, dotAttrsToBarAttrs(attrs));
};

DotStyle.prototype.createChunkView = function(chunk, dataSource) {
  return new DotChunkView(this.copyAttributes(), chunk, dataSource);
};

function dotAttrsToBarAttrs(attrs) {
  var barAttrs = {};
  var keys = Object.keys(attrs);
  var keyChanges = {dotSize: 'barWidth', dotSpacing: 'barSpacing'};
  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i];
    barAttrs[keyChanges[key] || key] = attrs[key];
  }
  return barAttrs;
}

exports.DotStyle = DotStyle;
