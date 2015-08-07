var textMeasurementLabel = null;

// AxisLabel is a label made to be drawn in a canvas.
function AxisLabel(value, formatter, content) {
  this.value = value;
  this.text = formatter(value);

  this.opacity = 1;
  this.fontFamily = content.getFontFamily();
  this.fontSize = content.getFontSize() + 'px';
  this.fontWeight = content.getFontWeight();

  this._measure();
}

AxisLabel.TEXT_COLOR = '153, 153, 153';

// copy generates a duplicate of this AxisLabel.
AxisLabel.prototype.copy = function() {
  var res = Object.create(AxisLabel.prototype);
  res.value = this.value;
  res.text = this.text;
  res.opacity = this.opacity;
  res.fontFamily = this.fontFamily;
  res.fontSize = this.fontSize;
  res.fontWeight = this.fontWeight;
  res.width = this.width;
  res.height = this.height;
  return res;
};

// draw draws the label in a context at a given position.
AxisLabel.prototype.draw = function(x, y, context) {
  context.font = this.fontWeight + ' ' + this.fontSize + ' ' + this.fontFamily;
  context.textBaseline = 'bottom';
  context.fillStyle = this.fillStyle();
  context.fillText(this.text, x, y);
};

// equals returns true if this label shares all the same properties as another one.
AxisLabel.prototype.equals = function(a) {
  return this.value === a.value && this.text === a.text && this.opacity === a.opacity &&
    this.fontFamily === a.fontFamily && this.fontSize === a.fontSize &&
    this.fontWeight === a.fontWeight && this.width === a.width && this.height === a.height;
};

// fillStyle is the canvas drawing style for the color and opacity of this label.
AxisLabel.prototype.fillStyle = function() {
  return 'rgba(' + AxisLabel.TEXT_COLOR + ', ' + formatAlpha(this.opacity) + ')';
};

AxisLabel.prototype._measure = function() {
  if (!textMeasurementLabel) {
    textMeasurementLabel = document.createElement('label');
    textMeasurementLabel.style.position = 'fixed'
    textMeasurementLabel.style.visibility = 'hidden';
    textMeasurementLabel.style.pointerEvents = 'none';
  }
  textMeasurementLabel.style.fontFamily = this.fontFamily;
  textMeasurementLabel.style.fontSize = this.fontSize;
  textMeasurementLabel.style.fontWeight = this.fontWeight;
  textMeasurementLabel.innerText = this.text;
  document.body.appendChild(textMeasurementLabel);
  this.width = textMeasurementLabel.offsetWidth;
  this.height = textMeasurementLabel.offsetHeight;
  document.body.removeChild(textMeasurementLabel);
};
