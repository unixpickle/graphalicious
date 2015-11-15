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

// computeRange generates a range of points whose corresponding BarChunkView would encompass the
// given region.
// This assumes that the created BarChunkView would include left and right spacing.
BarStyleAttrs.prototype.computeRange = function(region, pointCount) {
  if (pointCount === 0) {
    return {startIndex: 0, length: 0};
  }

  var startIndex = 0;
  if (region.left > this.getLeftMargin() + this.getBarWidth()) {
    var shifted = region.left - (this.getLeftMargin() + this.getBarWidth());
    startIndex = 1 + Math.floor(shifted/(this.getBarWidth()+this.getBarSpacing()));
  }

  var endIndex = 1;
  var right = region.left + region.width;
  if (right > this.getLeftMargin() + this.getBarWidth() + this.getBarSpacing()) {
    var shifted = right - (this.getLeftMargin() + this.getBarWidth() + getBarSpacing());
    endIndex = 2 + Math.floor(shifted/(this.getBarWidth()+this.getBarSpacing());
  }

  return {
    startIndex: Math.max(0, Math.min(pointCount-1, startIndex)),
    length: Math.max(0, Math.min(pointCount-startIndex, endIndex - startIndex))
  };
};

// computeRegion generates a region wrapping the given range.
// The region will include spacing on the left and right.
BarStyleAttrs.prototype.computeRegion = function(range, pointCount) {
  if (pointCount === 0) {
    return {left: 0, width: 0};
  }

  var maxLeft = this.getLeftMargin() + this.getRightMargin() + pointCount*this.getBarWidth() +
    Math.max(0, (pointCount-1)*this.getBarSpacing());

  var startLeft = 0;
  if (range.startIndex >= pointCount - 1) {
    startLeft = maxLeft;
  } else if (range.startIndex > 0) {
    startLeft = (range.startIndex-1)*this.getBarSpacing() + range.startIndex*this.getBarWidth();
  }

  var endLeft = 0;
  var endIndex = range.startIndex + range.length;
  if (endIndex >= pointCount) {
    endLeft = maxLeft;
  } else if (endIndex > 0) {
    endLeft = (this.getBarSpacing()+this.getBarWidth())*endIndex + this.getLeftMargin();
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
