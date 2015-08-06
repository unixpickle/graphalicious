//deps animation.js

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
  var metrics = measureLabel(this.text, content);
  this.width = metrics.width;
  this.height = metrics.height;
}

AxisLabel.TEXT_COLOR = '144, 144, 144';

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
  context.fillStyle = this.fillStyle();
  context.fillText(this.text, x, y);
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
