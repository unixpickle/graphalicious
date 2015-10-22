function LabelSettings(attrs) {
  this.leftMargin = attrs.leftMargin || LabelSettings.DEFAULT_MARGIN;
  this.rightMargin = attrs.rightMargin || LabelSettings.DEFAULT_MARGIN;
  this.textColor = attrs.textColor || LabelSettings.DEFAULT_TEXT_COLOR;
  this.font = attrs.font || LabelSettings.DEFAULT_FONT;
  this.opacity = attrs.opacity || 1;
}

LabelSettings.DEFAULT_MARGIN = 10;
LabelSettings.DEFAULT_TEXT_COLOR = '#999';
LabelSettings.DEFAULT_FONT = '10px sans-serif';

LabelSettings.prototype.margin = function() {
  return this.leftMargin + this.rightMargin;
};

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

  var count = this.text.length;
  var spacing = (bottomY - topY) / (count - 1);
  for (var i = 0; i < count; ++i) {
    var y = bottomY - spacing*i;
    ctx.fillText(this.text[i], y, leftX+this._width-this.settings.rightMargin);
  }
};
