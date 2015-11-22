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

BarStyleAttrs.STRETCH_MODE_JUSTIFY_LEFT = 0;
BarStyleAttrs.STRETCH_MODE_JUSTIFY_CENTER = 1;
BarStyleAttrs.STRETCH_MODE_JUSTIFY_RIGHT = 2;
BarStyleAttrs.STRETCH_MODE_ELONGATE = 3;

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

for (var i = 0, len = BarStyleAttrs.ATTRIBUTES.length; i < len; ++i) {
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
  var totalWidth = this.computeRegion({startIndex: 0, length: pointCount}, pointCount).width;
  region = boundedRegion(region, totalWidth);

  if (pointCount === 0 || region.width <= 0) {
    return {startIndex: 0, length: 0};
  }

  var startIndex = 0;
  if (region.left >= this.getLeftMargin() + this.getBarWidth()) {
    var shifted = region.left - (this.getLeftMargin() + this.getBarWidth());
    startIndex = 1 + Math.floor(shifted/(this.getBarWidth()+this.getBarSpacing()));
  }

  var endIndex = 1;
  var right = region.left + region.width;
  if (right > this.getLeftMargin() + this.getBarWidth() + this.getBarSpacing()) {
    var shifted = right - (this.getLeftMargin() + this.getBarWidth() + this.getBarSpacing());
    endIndex = 1 + Math.ceil(shifted/(this.getBarWidth()+this.getBarSpacing()));
  }

  return {
    startIndex: Math.max(0, Math.min(pointCount-1, startIndex)),
    length: Math.max(1, Math.min(pointCount-startIndex, endIndex-startIndex))
  };
};

// computeRegion generates a region wrapping the given range.
// The region will include spacing on the left and right.
BarStyleAttrs.prototype.computeRegion = function(range, pointCount) {
  range = boundedRange(range, pointCount);

  if (pointCount === 0 || range.length <= 0) {
    return {left: 0, width: 0};
  }

  var maxLeft = this.getLeftMargin() + this.getRightMargin() + pointCount*this.getBarWidth() +
    Math.max(0, (pointCount-1)*this.getBarSpacing());

  var startLeft = 0;
  if (range.startIndex >= pointCount) {
    startLeft = maxLeft;
  } else if (range.startIndex > 0) {
    startLeft = (range.startIndex-1)*this.getBarSpacing() + range.startIndex*this.getBarWidth() +
      this.getLeftMargin();
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

// Inherit global properties from BarStyleAttrs.
for (var attr in BarStyleAttrs) {
  if (attr.match(/^STRETCH_MODE_/) || attr.match(/^X_LABELS_/)) {
    BarStyle[attr] = BarStyleAttrs[attr];
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

function boundedRange(range, pointCount) {
  if (range.startIndex >= pointCount) {
    return {startIndex: 0, length: 0};
  } else if (range.startIndex + range.length <= 0) {
    return {startIndex: 0, length: 0};
  }

  var res = {startIndex: range.startIndex, length: range.length};

  if (res.startIndex < 0) {
    res.length += res.startIndex;
    res.startIndex = 0;
    if (res.length <= 0) {
      res.length = 0;
    }
  }

  if (res.startIndex + res.length >= pointCount) {
    res.length = pointCount - res.startIndex;
  }

  return res;
}

function boundedRegion(region, totalWidth) {
  if (region.left >= totalWidth) {
    return {left: 0, width: 0};
  } else if (region.left + region.width <= 0) {
    return {left: 0, width: 0};
  }

  var res = {left: region.left, width: region.width};

  if (res.left < 0) {
    res.width += res.left;
    res.left = 0;
    if (res.width <= 0) {
      res.width = 0;
    }
  }

  if (res.left + res.width >= totalWidth) {
    res.width = totalWidth - res.left;
  }

  return res;
}
