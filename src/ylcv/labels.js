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

// DurationLabelFormat creates Labels for duration values like "1:50.50".
function DurationLabelFormat(attrs) {
  this.minDivision = attrs.minDivision || DurationLabelFormat.DEFAULT_MIN_DIVISION;
  this.decimalPlaces = attrs.decimalPlaces || DurationLabelFormat.DEFAULT_DECIMAL_PLACES;
  this.minSpacing = attrs.minSpacing || DEFAULT_MIN_SPACING;
}

DurationLabelFormat.DEFAULT_MIN_DIVISION = 250;
DurationLabelFormat.DEFAULT_DECIMAL_PLACES = 2;

DurationLabelFormat.prototype.createLabels = function(minValue, maxValue, height, settings) {
  var count = Math.floor(height / this.minSpacing);

  // TODO: get a good division size using this.minDivision as a guide.
  // TODO: figure out a rounded minValue and maxValue using the chosen division.
  throw new Error('not yet implemented');
};

// IntegerLabelFormat creates Labels for integer values.
function IntegerLabelFormat(attrs) {
  this.minSpacing = attrs.minSpacing || DEFAULT_MIN_SPACING;
}

IntegerLabelFormat.prototype.createLabels = function(minValue, maxValue, height, settings) {
  var count = Math.floor(height / this.minSpacing);
  var division = Math.max(1, Math.floor((maxValue - minValue) / count));

  var values = [];
  var text = [];
  for (var i = 0; i < count; ++i) {
    var labelValue = minValue + i*division;
    values[i] = labelValue;
    if (labelValue === 0) {
      text[i] = ''
    } else {
      text[i] = '' + labelValue;
    }
  }

  return new Labels(text, values, settings);
};
