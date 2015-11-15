//deps includes.js

function BarStyleAttrs(attrs) {
  for (var i = 0, len = BarStyleAttrs.ATTRIBUTES.length; i < len; ++i) {
    var key = BarStyleAttrs.ATTRIBUTES[i];
    if (attrs.hasOwnProperty(key)) {
      this['_' + key] = attrs[key]
    } else {
      this['_' + key] = BarStyleAttrs.DEFAULTS[key];
    }
  }
}

BarStyleAttrs.STRETCH_MODE_JUSTIFY_RIGHT = 0;
BarStyleAttrs.STRETCH_MODE_JUSTIFY_LEFT = 1;
BarStyleAttrs.STRETCH_MODE_FILL = 2;

BarStyleAttrs.X_LABELS_LEFT = 0;
BarStyleAttrs.X_LABELS_CENTER = 1;
BarStyleAttrs.X_LABELS_RIGHT = 2;

BarStyleAttrs.ATTRIBUTES = ['colorScheme', 'leftMargin', 'rightMargin', 'barSpacing', 'barWidth',
  'stretchMode', 'xLabelAlignment', 'animateDeletions', 'animateInsertions',
  'animateModifications'];

BarStyleAttrs.DEFAULTS = {
  stretchMode: BarStyleAttrs.STRETCH_MODE_JUSTIFY_RIGHT,
  xLabelAlignment: BarStyleAttrs.X_LABELS_LEFT,
  animateDeletions: true,
  animateInsertions: true,
  animateModifications: true
};

for (var i = 0, len = BarStyleAttrs.ATTRIBUTES; i < len; ++i) {
  var key = BarStyleAttrs.ATTRIBUTES[i];
  (function(key) {
    BarStyleAttrs.prototype['get' + key[0].toUpperCase() + key.substr(1)] = function() {
      return this['_' + key];
    };
  })(key);
}

BarStyleAttrs.prototype.copyAttributes = function() {
  var attrs = {};
  for (var i = 0, len = BarStyleAttrs.ATTRIBUTES.length; i < len; ++i) {
    var key = BarStyleAttrs.ATTRIBUTES[i];
    attrs[key] = this['_' + key];
  }
  return new BarStyleAttrs(attrs);
};

BarStyleAttrs.prototype.computeRange = function(region, pointCount) {
  var startIndex = Math.floor((region.left - this.getLeftMargin()) /
    (this.getBarSpacing() + this.getBarWidth()));
  var endIndex = Math.ceil((region.left + region.width - this.getLeftMargin()) /
    (this.getBarSpacing() + this.getBarWidth()));

  return {
    startIndex: Math.max(0, Math.min(pointCount-1, startIndex)),
    length: Math.max(0, Math.min(length, endIndex - startIndex))
  };
};

BarStyleAttrs.prototype.computeRegion = function(range, pointCount) {
  var maxLeft = this.getLeftMargin() + this.getRightMargin() + pointCount*this.getBarWidth() +
    Math.max(0, (pointCount-1)*this.getBarSpacing());

  var startLeft = 0;
  if (range.startIndex >= pointCount - 1) {
    startLeft = maxLeft;
  } else if (range.startIndex > 0) {
    startLeft = (this.getBarSpacing()+this.getBarWidth())*range.startIndex + this.getLeftMargin();
  }

  var endLeft = 0;
  var endIndex = range.startIndex + range.length - 1;
  if (endIndex >= pointCount-1) {
    endLeft = maxLeft;
  } else if (endIndex > 0) {
    endLeft = (this.getBarSpacing()+this.getBarWidth())*range.startIndex + this.getLeftMargin();
  }

  assert(startLeft <= endLeft);

  return {left: startLeft, width: endLeft-startLeft};
};

BarStyleAttrs.prototype.xLabelPosition = function(pointIndex, pointCount) {
  var barLeft = this.getLeftSpacing() + (this.getBarWidth()+this.getBarSpacing())*pointIndex;
  switch (this.getXLabelAlignment()) {
  case BarStyleAttrs.X_LABELS_LEFT:
    if (pointIndex === 0) {
      return this.getLeftMargin() / 2;
    } else {
      return barLeft - this.getBarSpacing()/2;
    }
    break;
  case BarStyleAttrs.X_LABELS_RIGHT:
    if (pointIndex === pointCount-1) {
      var fullWidth = this.computeRegion({startIndex: 0, length: pointCount}, pointCount).width;
      return fullWidth - (this.getRightMargin() / 2);
    } else {
      return barLeft + this.getBarWidth() + this.getBarSpacing()/2;
    }
    break;
  case BarStyleAttrs.X_LABELS_CENTER:
    return barLeft + (this.getBarWidth() / 2);
    break;
  default:
    throw new Error('unknown xLabelAlignment: ' + this.getXLabelAlignment());
  }
};

function BarStyle(attrs) {
  EventEmitter.call(this);
  BarStyleAttrs.call(this, attrs);

  this.getColorScheme().on('change', this.emit.bind('superficialChange'));
}

BarStyle.prototype = Object.create(EventEmitter.prototype);

// Inheret from BarStyleAttrs as well as EventEmitter.
for (var attr in BarStyleAttrs.prototype) {
  if (BarStyleAttrs.prototype.hasOwnProperty(attr)) {
    BarStyle.prototype[attr] = BarStyleAttrs.prototype[attr];
  }
}

BarStyle.prototype.setAttributes = function(attrs) {
  var allKeys = ['leftMargin', 'rightMargin', 'barSpacing', 'barWidth', 'stretchMode',
    'xLabelAlignment'];
  for (var i = 0, len = allKeys.length; i < len; ++i) {
    var key = allKeys[i];
    if (attrs.hasOwnProperty(key)) {
      this['_' + key] = attrs[key];
    }
  }
  this.emit('metricChange');
};

BarStyle.prototype.createChunkView = function(chunk, dataSource) {
  return new BarChunkView(this.copyAttributes(), chunk, dataSource);
};

exports.BarStyle = BarStyle;
