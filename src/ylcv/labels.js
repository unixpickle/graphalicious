// LabelSettings stores the visual information used by a Labels object to draw itself.
function LabelSettings(attrs) {
  this.leftMargin = attrs.leftMargin || LabelSettings.DEFAULT_MARGIN;
  this.rightMargin = attrs.rightMargin || LabelSettings.DEFAULT_MARGIN;
  this.color = attrs.color || LabelSettings.DEFAULT_COLOR;
  this.font = attrs.font || LabelSettings.DEFAULT_FONT;
  this.opacity = attrs.opacity || 1;
}

LabelSettings.DEFAULT_MARGIN = 10;
LabelSettings.DEFAULT_COLOR = '#999';
LabelSettings.DEFAULT_FONT = '10px sans-serif';

LabelSettings.prototype.margin = function() {
  return this.leftMargin + this.rightMargin;
};

LabelSettings.prototype.equals = function(s) {
  return this.leftMargin === s.leftMargin && this.rightMargin === s.rightMargin &&
    this.color === s.color && this.font === s.font && this.opacity === s.opacity;
};

// Labels represents a group of vertically-stacked labels, each backed by a numerical value.
function Labels(text, values, settings) {
  if (!Array.isArray(text) || !Array.isArray(values) || text.length !== values.length ||
      this.text.length < 2) {
    throw new Error('invalid arguments');
  }
  this.text = text;
  this.values = values;
  this.settings = settings;

  this._width = 0;
  for (var i = 0, len = text.length; i < len; ++i) {
    this._width = Math.max(this._width, measureLabel(text[i], this.settings.font));
  }
  this._width += this.settings.margin();
}

Labels.widthContext = document.createElement('canvas').getContext('2d');

Labels.measureLabel = function(text, font) {
  Labels.widthContext.font = font;
  return Labels.widthContext.measureText(text);
};

Labels.prototype.width = function() {
  return this.width;
};

Labels.prototype.equals = function(labels) {
  if (this.text.length !== labels.text.length || this._width !== labels._width) {
    return false;
  } if (!this.settings.equals(labels.settings)) {
    return false;
  }
  for (var i = 0, len = this.text.length; i < len; ++i) {
    if (this.text[i] !== labels.text[i] || this.values[i] !== labels.values[i]) {
      return false;
    }
  }
  return true;
};

Labels.prototype.draw = function(ctx, leftX, topY, bottomY) {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'end';
  ctx.font = this.settings.font;
  ctx.fillStyle = this.settings.color;

  var oldAlpha = ctx.globalAlpha;
  ctx.globalAlpha *= this.settings.opacity;

  var count = this.text.length;
  var spacing = (bottomY - topY) / (count - 1);
  for (var i = 0; i < count; ++i) {
    var y = bottomY - spacing*i;
    ctx.fillText(this.text[i], y, leftX+this._width-this.settings.rightMargin);
  }

  ctx.globalAlpha = oldAlpha;
};

var DEFAULT_MIN_SPACING = 20;
var DEFAULT_TOP_MARGIN = 10;

// DurationLabelFormat creates Labels for duration values like "1:50.50".
function DurationLabelFormat(attrs) {
  this.divisions = attrs.divisions || DurationLabelFormat.DEFAULT_DIVISIONS;
  this.decimalPlaces = attrs.decimalPlaces || DurationLabelFormat.DEFAULT_DECIMAL_PLACES;
  this.minSpacing = attrs.minSpacing || DEFAULT_MIN_SPACING;
  this.topMargin = attrs.topMargin || DEFAULT_TOP_MARGIN;
}

DurationLabelFormat.DEFAULT_DIVISIONS = [250, 1000, 5000, 10000, 20000, 30000, 60000];
DurationLabelFormat.DEFAULT_DECIMAL_PLACES = 2;

DurationLabelFormat.prototype.createLabels = function(maxValue, height, settings) {
  var count = Math.floor(height / this.minSpacing);
  var maxValueForMargin = maxValue * height / (height - this.topMargin);
  var minDivision = maxValueForMargin / count;

  var division = -1;
  var error = Infinity;
  for (var i = 0, len = this.divisions.length; i < len; ++i) {
    // Avoid using divisions when larger divisions still give good granularity.
    if (i < len-1 && minDivision < this.divisions[i+1]) {
      continue;
    }

    var divisionFactor = this.divisions[i];
    var thisDivision = divisionFactor * Math.ceil(minDivision / divisionFactor);
    var thisError = thisDivision*count - maxValueForMargin;
    if (thisError < error) {
      division = thisDivision;
      error = thisError;
    }
  }

  var values = [];
  var text = [];
  for (var i = 0; i < count; ++i) {
    var labelValue = i*division;
    values[i] = labelValue;
    if (labelValue === 0) {
      text[i] = ''
    } else {
      if (labelValue % 1000 === 0) {
        text[i] = formatDuration(labelValue, 0);
      } else {
        text[i] = formatDuration(labelValue, this.decimalPlaces);
      }
    }
  }

  return new Labels(text, values, settings);
};

function formatDuration(millis, decimalPlaces) {
  var pow = Math.pow(10, decimalPlaces);
  var fractional = ((Math.floor(millis / 1000 * pow) % pow) / pow).toFixed(decimalPlaces).substr(1);
  var seconds = '' + (Math.floor(millis/1000)%60);
  var minutes = '' + (Math.floor(millis/60000)%60);
  var hours = '' + (Math.floor(millis/3600000)%60);
  if (minutes === '0' && hours === '0') {
    return seconds + fractional;
  } else if (hours === '0') {
    return minutes + ':' + padZero(seconds) + fractional;
  } else {
    seconds = padZero(seconds);
    minutes = padZero(minutes);
    return hours + ':' + padZero(minutes) + ':' + padZero(seconds) + fractional;
  }
}

function padZero(s) {
  return s.length < 2 ? '0' + s : s;
}

// IntegerLabelFormat creates Labels for integer values.
function IntegerLabelFormat(attrs) {
  this.minSpacing = attrs.minSpacing || DEFAULT_MIN_SPACING;
  this.topMargin = attrs.topMargin || DEFAULT_TOP_MARGIN;
}

IntegerLabelFormat.prototype.createLabels = function(maxValue, height, settings) {
  var count = Math.floor(height / this.minSpacing);
  var maxValueForMargin = maxValue * height / (height - this.topMargin);
  var division = Math.max(1, Math.ceil(maxValueForMargin / count));

  var values = [];
  var text = [];
  for (var i = 0; i < count; ++i) {
    var labelValue = i*division;
    values[i] = labelValue;
    if (labelValue === 0) {
      text[i] = ''
    } else {
      text[i] = '' + labelValue;
    }
  }

  return new Labels(text, values, settings);
};

exports.DurationLabelFormat;
exports.IntegerLabelFormat;
