var textMeasurementLabel = null;

// AxisLabel is a label made to be drawn in a canvas.
function AxisLabel(text, font) {
  this.text = text;
  this.opacity = 1;
  this.font = font;
  this._measure();
}

AxisLabel.TEXT_COLOR = '153, 153, 153';

// copy creates a duplicate of this AxisLabel.
AxisLabel.prototype.copy = function() {
  var res = Object.create(AxisLabel.prototype);
  res.text = this.text;
  res.opacity = this.opacity;
  res.font = this.font;
  return res;
};

// draw draws the label in a 2D graphics context at a given position.
AxisLabel.prototype.draw = function(x, y, context) {
  context.font = this.font;
  context.textBaseline = 'bottom';
  context.fillStyle = this.fillStyle();
  context.fillText(this.text, x, y);
};

// equals returns true if this label shares all the same properties as another one.
AxisLabel.prototype.equals = function(a) {
  return this.text === a.text && this.opacity === a.opacity && this.font === a.font;
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
  textMeasurementLabel.style.font = this.font;
  textMeasurementLabel.innerText = this.text;
  document.body.appendChild(textMeasurementLabel);
  this.width = textMeasurementLabel.offsetWidth;
  this.height = textMeasurementLabel.offsetHeight;
  document.body.removeChild(textMeasurementLabel);
};
