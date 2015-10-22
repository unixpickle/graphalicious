function Labels(text, values, font) {
  if (!Array.isArray(text) || !Array.isArray(values) || text.length !== values.length ||
      this.text.length < 2) {
    throw new Error('invalid arguments');
  }
  this.text = text;
  this.values = values;
  this.width = 0;
  for (var i = 0, len = text.length; i < len; ++i) {
    this.width = Math.max(this.width, measureLabel(text[i], font));
  }
}

Labels.widthContext = document.createElement('canvas').getContext('2d');

Labels.measureLabel = function(text, font) {
  Labels.widthContext.font = font;
  return Labels.widthContext.measureText(text);
};

Labels.prototype.draw = function(ctx, leftX, topY, height) {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'end';

  var spacing = (height / (this.text.length - 1));
  for (var i = 0, len = this.text.length; i < len; ++i) {
    var y = topY + spacing*i;
    ctx.fillText(this.text[len-i-1], y, leftX+this.width);
  }
};
