// AxisLabel is a label made to be drawn in a canvas.
function AxisLabel(text, font) {
  this.text = text;
  this.opacity = 1;
  this.font = font;
  
  var measurement = TextMeasurement.getGlobalMeasurement().measure(text, font);
  this.width = measurement.width;
  this.height = measurement.height;
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
  context.textBaseline = 'middle';
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

// TextMeasurement computes the size of text labels.
function TextMeasurement() {
  this._canvas = document.createElement('canvas');
  this._canvas.width = 1;
  this._canvas.height = 1;
  this._context = this._canvas.getContext('2d');
  
  this._label = document.createElement('label');
  this._label.style.position = 'fixed';
  this._label.style.visibility = 'hidden';
  this._label.style.pointerEvents = 'none';
  
  this._cachedFont = null;
  this._cachedHeight = 0;
}

TextMeasurement._globalObject = null;

// getGlobalMeasurement returns a singleton TextMeasurement object.
TextMeasurement.getGlobalMeasurement = function() {
  if (!TextMeasurement._globalObject) {
    TextMeasurement._globalObject = new TextMeasurement();
  }
  return TextMeasurement._globalObject;
};

// measure returns an object with a width and height attribute.
TextMeasurement.prototype.measure = function(text, font) {
  this._context.font = font;
  return {
    width: this._context.measureText(font).width,
    height: this._heightOfFont(font)
  };
};

TextMeasurement.prototype._heightOfFont = function(font) {
  if (this._cachedFont !== font) {
    this._cachedFont = font;
    this._label.style.font = font;
    this._label.innerText = 'Mg';
    document.body.appendChild(this._label);
    this._cachedHeight = this._label.offsetHeight;
    document.body.removeChild(this._label);
  }
  return this._cachedHeight;
};
