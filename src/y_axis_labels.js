//deps animation.js axis_label.js

// YAxisLabel is an AxisLabel with an extra value attribute.
function YAxisLabel(text, font, value) {
  AxisLabel.call(this, text, font);
  this.value = value;
}

YAxisLabel.prototype = Object.create(AxisLabel.prototype);

// copy creates a duplicate of this label.
YAxisLabel.prototype.copy = function() {
  var res = Object.create(YAxisLabel.prototype);
  res.text = this.text;
  res.opacity = this.opacity;
  res.font = this.font;
  res.value = this.value;
  return res;
};

// equals returns true if this label shares all the same properties as another one.
YAxisLabel.prototype.equals = function(a) {
  return AxisLabel.prototype.equals.call(this, a) && this.value === a.value;
};

// YAxisLabels lays out and draws multiple YAxisLabel objects at once.
function YAxisLabels(labels, width, maxValue) {
  this._labels = labels;
  this._width = width;
  this._maxValue = maxValue;
}

YAxisLabels.LINE_COLOR = '240, 240, 240';
YAxisLabels.LINE_THICKNESS = 2;
YAxisLabels.PADDING_BOTTOM = 15;
YAxisLabels.PADDING_LEFT = 10;
YAxisLabels.PADDING_RIGHT = 10;
YAxisLabels.PADDING_TOP = 20;
YAxisLabels.SOFT_MAX_VALUE_MARGIN = 10;
YAxisLabels.SOFT_MINIMUM_SPACE = 30;

// createForContent generates YAxisLabels which fit content as well as possible.
YAxisLabels.createForContent = function(maxValue, height, font, content) {
  height -= YAxisLabels.PADDING_BOTTOM + YAxisLabels.PADDING_TOP;

  // I used the following algebra here:
  //     height - SOFT_MAX_VALUE_MARGIN = height * maxValue / x
  //  => x = (height * maxValue)/(height - SOFT_MAX_VALUE_MARGIN)
  maxValue = (height * maxValue) / (height - YAxisLabels.SOFT_MAX_VALUE_MARGIN);

  var labelCount = Math.floor(height / YAxisLabels.SOFT_MINIMUM_SPACE) + 1;
  if (labelCount < 2) {
    return new YAxisLabels([], 0, maxValue);
  }

  var divisions = content.niceYAxisDivisions(maxValue, labelCount);
  var labels = [];
  var width = 0;
  for (var i = 0; i < labelCount; ++i) {
    var value = divisions[i];
    var label = new YAxisLabel(content.formatYLabel(value), font, value);
    labels.push(label);
    width = Math.max(label.width+YAxisLabels.PADDING_LEFT+YAxisLabels.PADDING_RIGHT, width);
  }
  var highestValue = divisions[divisions.length-1];
  return new YAxisLabels(labels, width, highestValue);
};

// draw spaces out the y-axis labels for the viewport's height and draws them on the left side of
// the viewport. Additionally, it draws a horizontal line for each label.
YAxisLabels.prototype.draw = function(viewport) {
  viewport.enter();
  var height = viewport.height() - (YAxisLabels.PADDING_BOTTOM + YAxisLabels.PADDING_TOP);
  var context = viewport.context();
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    var label = this._labels[i];
    var yRatio = label.value / this._maxValue;
    var y = height - (YAxisLabels.PADDING_BOTTOM + yRatio*height);

    context.fillStyle = 'rgba(' + YAxisLabels.LINE_COLOR + ', ' + formatAlpha(label.opacity) + ')';
    context.fillRect(this._width, y-(YAxisLabels.LINE_THICKNESS/2), viewport.width()-this._width,
      YAxisLabels.LINE_THICKNESS);

    label.draw(YAxisLabels.PADDING_LEFT, y, context);
  }
  viewport.leave();
};

// equals returns true if this object is equivalent to another YAxisLabels object.
YAxisLabels.prototype.equals = function(another) {
  if (this._width !== another._width || this._maxValue !== another._maxValue ||
      this._labels.length !== another._labels.length) {
    return false;
  }
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    if (!this._labels[i].equals(another._labels[i])) {
      return false;
    }
  }
  return true;
};

// getLabels returns an array of labels contained by this object.
YAxisLabels.prototype.getLabels = function() {
  return this._labels;
};

// getMaxValue returns the internal maxValue attribute.
// This may differ from the value of the top label.
YAxisLabels.prototype.getMaxValue = function() {
  return this._maxValue;
}

// getWidth returns the internal width attribute of this YAxisLabels object.
YAxisLabels.prototype.getWidth = function() {
  return this._width;
};

// setMaxValue changes the internal maxValue attribute. This will affect how the labels are drawn.
YAxisLabels.prototype.setMaxValue = function(value) {
  this._maxValue = value;
};

// setWidth changes the internal maxValue attribute. This will affect how the labels are drawn.
YAxisLabels.prototype.setWidth = function(width) {
  this._width = width;
};
