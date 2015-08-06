//deps animation.js

var textMeasurementLabel = null;

// YStage is a stage which presents content with y-axis labels but no x-axis labels.
function YStage(scrollView, content) {
  this._scrollView = scrollView;
  this._content = content;

  this._animation = null;
  this._labels = null;

  this._registerEvents();
  this._layout();
}

YStage.prototype._currentLabels = function() {
  return this._animation !== null : this._animation.labels() : this._labels;
};

YStage.prototype._draw = function() {
  var canvas = this._scrollView.getGraphCanvas();
  this._currentLabels().draw(canvas.height(), canvas);

  // TODO: draw the content here.
};

YStage.prototype._layout = function() {
  // TODO: here, figure out whether everything should scroll.
};

YStage.prototype._registerEvents = function() {
  this._scrollView.on('change', this._layout);
  this._content.on('change', this._layout);
  this._scrollView.getGraphCanvas().on('layout', this._layout);
};

// YLabel represents a y-axis label.
function YLabel(value, content) {
  this.value = value;
  this.text = content.formatYLabel(value);
  var metrics = measureLabel(this.text, content);
  this.width = metrics.width;
  this.height = metrics.height;
  this.opacity = 1;
  this.y = 0;
  this.fontFamily = content.getFontFamily();
  this.fontSize = content.getFontSize();
  this.fontWeight = content.getFontWeight();
}

YLabel.LINE_THICKNESS = 2;

// copy generates a duplicate of this YLabel.
YLabel.prototype.copy = function() {
  var res = Object.create(YLabel.prototype);
  res.value = this.value;
  res.text = this.text;
  res.width = this.width;
  res.height = this.height;
  res.opacity = this.opacity;
  res.y = this.y;
  res.fontFamily = this.fontFamily;
  res.fontSize = this.fontSize;
  res.fontWeight = this.fontWeight;
  return res;
};

// draw draws the y-axis label in a context.
YLabel.prototype.draw = function(width, x, context) {
  context.font = this.fontWeight + ' ' + this.fontSize + 'px ' + this.fontFamily;
  context.fillStyle = 'rgba(144, 144, 144, ' + formatAlpha(this.opacity) + ')';
  context.fillText(this.text, x, this.y-this.height/2);
  context.fillRect(x+this.width+YLabels.PADDING_RIGHT, Math.round(this.y-YLabel.LINE_THICKNESS/2),
    width, YLabel.LINE_THICKNESS);
};

// YLabels lays out y-axis labels and spaces them out appropriately.
function YLabels(outerHeight, height, maxValue, content) {
  this._labels = [];
  this._width = 0;

  var usableHeight = height - (YLabels.PADDING_TOP + YLabels.PADDING_BOTTOM);

  var firstLabel = new YLabel(0, content);
  var lastLabel = new YLabel(maxValue, content);
  firstLabel.y = height - YLabels.PADDING_BOTTOM;
  lastLabel.y = YLabels.PADDING_TOP;

  var usableOuterHeight = outerHeight - (YLabels.PADDING_BOTTOM + YLabels.PADDING_TOP);
  var labelHeight = Math.max(firstLabel.height, lastLabel.height);
  var labelCount = Math.floor((usableOuterHeight+YLabels.MIN_LABEL_SPACE) /
    (labelHeight+YLabels.MIN_LABEL_SPACE));

  if (labelCount <= 2) {
    return;
  }

  var labelSpacing = usableHeight / (labelCount - 1);

  this._labels.push(firstLabel);
  for (var i = 1; i < labelCount-1; ++i) {
    var label = new YLabel((maxValue/(labelCount-1))*i, content);
    label.y = firstLabel.y + labelSpacing*i;
  }
  this._labels.push(lastLabel);

  for (var i = 0, len = this._labels.length; i < len; ++i) {
    this._width = Math.max(this._labels[i].width+YLabels.PADDING_LEFT+YLabels.PADDING_RIGHT,
      this._width);
  }
}

YLabels.MIN_LABEL_SPACE = 30;
YLabels.PADDING_BOTTOM = 15;
YLabels.PADDING_LEFT = 5;
YLabels.PADDING_RIGHT = 5;
YLabels.PADDING_TOP = 20;

YLabels.intermediate = function(start, end, fraction) {
  var newMaxValue = start._maxValue() + (end._maxValue()-start._maxValue())*fraction;
  var newHeight = end._usedHeight();

  var newLabels = end._copy();
  newLabels._scale(newHeight, newMaxValue);
  newLabels._setOpacity(1-fraction);

  var endLabels = end._copy();
  endLabels._setOpacity(fraction);
  newLabels._add(endLabels);

  newLabels._width = start._width + (end._width-start._width)*fraction;

  return newLabels;
};

YLabels.prototype.draw = function(width, context) {
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    var label = this._labels[i];
    var x = this._width - (YLabels.PADDING_RIGHT + label.width);
    label.draw(width, x, context);
  }
};

YLabels.prototype._add = function(labels) {
  for (var i = 0, len = labels._labels.length; i < len; ++i) {
    this._labels.push(labels._labels[i].copy());
  }
  this._labels.sort(function(a, b) {
    return a.value - b.value;
  });

  // Remove redundant labels.
  for (var i = 1; i < this._labels.length; ++i) {
    if (this._labels[i-1].value === this._labels[i].value) {
      this._labels.splice(i, 1);
      this._labels[i-1].opacity = 1;
      --i;
    }
  }
};

YLabels.prototype._copy = function() {
  var res = Object.create(YLabels.prototype);
  res._labels = [];
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    res._labels[i] = this._labels[i].copy();
  }
  return res;
};

YLabels.prototype._maxValue = function() {
  return this._labels[this._labels.length-1].value;
};

YLabels.prototype._scale = function(newHeight, newMaxValue) {
  var scale = (newHeight*newMaxValue) / (this._usedHeight()*this._maxValue());
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    this._labels.y -= YLabels.PADDING_TOP;
    this._labels.y *= scale;
    this._labels.y += YLabels.PADDING_TOP;
  }
};

YLabels.prototype._setOpacity = function(opacity) {
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    this._labels[i].opacity = opacity;
  }
};

YLabels.prototype._usedHeight = function() {
  return this._labels[0].y - YLabels.PADDING_TOP;
};

// YLabelsAnimation runs an animation between a start YLabels and an end YLabels.
function YLabelsAnimation(start, end) {
  ValueAnimation.call(this);
  this._startLabels = start;
  this._endLabels = end;
}

YLabelsAnimation.prototype = Object.create(ValueAnimation.prototype);

// labels returns the current YLabels.
YLabelsAnimation.prototype.labels = function() {
  return YLabels.intermediate(this._startLabels, this._endLabels, this.value());
};

// setEndLabels updates the state to which the animation is going.
YLabelsAnimation.prototype.setEndLabels = function(newLabels) {
  this._endLabels = newLabels;
};

function measureLabel(text, content) {
  if (!textMeasurementLabel) {
    textMeasurementLabel = document.createElement('label');
    textMeasurementLabel.style.position = 'fixed'
    textMeasurementLabel.style.visibility = 'hidden';
    textMeasurementLabel.style.pointerEvents = 'none';
  }
  textMeasurementLabel.style.fontFamily = content.getFontFamily();
  textMeasurementLabel.style.fontSize = content.getFontSize() + 'px';
  textMeasurementLabel.style.fontWeight = content.getFontWeight();
  textMeasurementLabel.innerText = text;
  document.body.appendChild(textMeasurementLabel);
  var labelWidth = textMeasurementLabel.offsetWidth;
  var labelHeight = textMeasurementLabel.offsetHeight;
  document.body.removeChild(textMeasurementLabel);
  return {width: labelWidth, height: labelHeight};
}
