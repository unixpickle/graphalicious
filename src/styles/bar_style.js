//deps includes.js

function BarStyleAttrs(attrs) {
  setPrivateAttributeVariables(this, attrs, BarStyleAttrs.ATTRIBUTES,
    BarStyleAttrs.DEFAULTS);
}

BarStyleAttrs.JUSTIFY_LEFT = 0;
BarStyleAttrs.JUSTIFY_CENTER = 1;
BarStyleAttrs.JUSTIFY_RIGHT = 2;

BarStyleAttrs.X_LABELS_LEFT = 0;
BarStyleAttrs.X_LABELS_CENTER = 1;
BarStyleAttrs.X_LABELS_RIGHT = 2;

BarStyleAttrs.ATTRIBUTES = ['colorScheme', 'leftMargin', 'rightMargin', 'barSpacing', 'barWidth',
  'maxElongation', 'justification', 'xLabelAlignment', 'animateDeletions', 'animateInsertions',
  'animateModifications', 'blurbTextColor', 'blurbFont'];

BarStyleAttrs.DEFAULTS = {
  justification: BarStyleAttrs.JUSTIFY_RIGHT,
  maxElongation: 1,
  xLabelAlignment: BarStyleAttrs.X_LABELS_LEFT,
  animateDeletions: true,
  animateInsertions: true,
  animateModifications: true,
  blurbTextColor: '#999',
  blurbFont: '18px sans-serif'
};

defineAttributeMethods(BarStyleAttrs, BarStyleAttrs.ATTRIBUTES);

// computeRange generates a range of points whose corresponding BarChunkView would encompass the
// given region.
// This assumes that the created BarChunkView would include left and right spacing.
BarStyleAttrs.prototype.computeRange = function(region, pointCount) {
  assert('number' === typeof pointCount);

  var totalRegion = this.computeRegion({startIndex: 0, length: pointCount}, pointCount);
  region = regionIntersection(region, totalRegion);

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
  assert('number' === typeof pointCount);

  range = rangeIntersection(range, {startIndex: 0, length: pointCount});

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

  this.getColorScheme().on('change', this.emit.bind(this, 'superficialChange'));
}

BarStyle.prototype = Object.create(EventEmitter.prototype);
BarStyle.prototype.constructor = BarStyle;

// Inheret from BarStyleAttrs as well as EventEmitter.
for (var attr in BarStyleAttrs.prototype) {
  if (BarStyleAttrs.prototype.hasOwnProperty(attr)) {
    BarStyle.prototype[attr] = BarStyleAttrs.prototype[attr];
  }
}

// Inherit global properties from BarStyleAttrs.
for (var attr in BarStyleAttrs) {
  if (attr.match(/^(JUSTIFY_|X_LABELS_)/)) {
    BarStyle[attr] = BarStyleAttrs[attr];
  }
}

BarStyle.prototype.setAttributes = function(attrs) {
  BarStyleAttrs.prototype.setAttributes.call(this, attrs);
  this.emit('metricChange');
};

BarStyle.prototype.createChunkView = function(chunk, dataSource, harmonizerContext) {
  return new BarChunkView(this.copyAttributes(), chunk, dataSource, harmonizerContext);
};

exports.BarStyle = BarStyle;
