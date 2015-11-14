//deps includes.js

function BarStyle(attrs) {
  EventEmitter.call(this);

  this._colorScheme = attrs.colorScheme;
  this._leftMargin = attrs.leftMargin;
  this._rightMargin = attrs.rightMargin;
  this._barSpacing = attrs.barSpacing;
  this._barWidth = attrs.barWidth;
  this._stretchMode = attrs.stretchMode;

  this._colorScheme.on('change', this.emit.bind('superficialChange'));
}

BarStyle.STRETCH_MODE_JUSTIFY_RIGHT = 0;
BarStyle.STRETCH_MODE_JUSTIFY_LEFT = 1;

BarStyle.prototype = Object.create(EventEmitter.prototype);

BarStyle.prototype.computeRange = function(region, pointCount) {
  var startIndex = Math.floor((region.left - this.getLeftMargin()) /
    (this.getBarSpacing() + this.getBarWidth()));
  var endIndex = Math.ceil((region.left + region.width - this.getLeftMargin()) /
    (this.getBarSpacing() + this.getBarWidth()));

  return {
    startIndex: Math.max(0, Math.min(pointCount-1, startIndex)),
    length: Math.max(0, Math.min(length, endIndex - startIndex))
  };
};

BarStyle.prototype.computeRegion = function(range, pointCount) {
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

BarStyle.prototype.getColorScheme = function() {
  return this._colorScheme;
};

BarStyle.prototype.getLeftMargin = function() {
  return this._leftMargin;
};

BarStyle.prototype.getRightMargin = function() {
  return this._rightMargin;
};

BarStyle.prototype.getBarSpacing = function() {
  return this._barSpacing;
};

BarStyle.prototype.getBarWidth = function() {
  return this._barWidth;
};

BarStyle.prototype.getStretchMode = function() {
  return this._stretchMode;
};

BarStyle.prototype.setAttributes = function(attrs) {
  var allKeys = ['leftMargin', 'rightMargin', 'barSpacing', 'barWidth', 'stretchMode'];
  for (var i = 0, len = allKeys.length; i < len; ++i) {
    var key = allKeys[i];
    if (attrs.hasOwnProperty(key)) {
      this['_' + key] = attrs[key];
    }
  }
  this.emit('metricChange');
};

exports.BarStyle = BarStyle;
