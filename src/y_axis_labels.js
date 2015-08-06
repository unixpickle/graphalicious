//deps animation.js

// YAxisLabels animates and manipulates the y-axis labels.
function YAxisLabels(labels, width, maxValue) {
  this._labels = labels;
  this._width = width;
  this._maxValue = maxValue;
}

YAxisLabels.LABEL_SPACING_HEURISTIC = 30;
YAxisLabels.LINE_THICKNESS = 2;
YAxisLabels.PADDING_BOTTOM = 15;
YAxisLabels.PADDING_LEFT = 5;
YAxisLabels.PADDING_RIGHT = 5;
YAxisLabels.PADDING_TOP = 20;

// createForContent generates YAxisLabels which fit a content as well as possible.
YAxisLabels.createForContent = function(maxValue, content, usableHeight) {
  var insetHeight = usableHeight - (YAxisLabels.PADDING_BOTTOM + YAxisLabels.PADDING_TOP);
  var count = Math.floor(insetHeight / YAxisLabels.LABEL_SPACING_HEURISTIC) + 1;
  if (count < 2) {
    return new YAxisLabels([], 0, maxValue);
  }

  var divisions = content.niceYAxisDivisions(maxValue, count);
  var labels = [];
  var width = 0;
  for (var i = 0; i < count; ++i) {
    var label = new AxisLabel(divisions[i], content.formatYLabel, content);
    labels.push(label);
    width = Math.max(label.width+YAxisLabels.PADDING_LEFT+YAxisLabels.PADDING_RIGHT, width);
  }

  return new YAxisLabels(labels, width, divisions[divisions.length-1]);
};

// intermediate is used to animate between YAxisLabels.
YAxisLabels.intermediate = function(start, end, fraction) {
  var manipulatedEnd = end._copy();
  manipulatedEnd._setOpacity(fraction);

  var manipulatedStart = start._copy();
  manipulatedStart._setOpacity(1-fraction);

  var result = manipulatedStart._add(manipulatedEnd);
  result._maxValue = start._maxValue + (end._maxValue-start._maxValue)*fraction;
  result._width = start._width + (end._width-start._width)*fraction;

  return result;
};

// draw draws the YAxisLabels in a 2D drawing context.
YAxisLabels.prototype.draw = function(height, canvas) {
  var context = canvas.context();
  var usableHeight = height - (YAxisLabels.PADDING_TOP + YAxisLabels.PADDING_BOTTOM);
  var spacing = usableHeight / (this._labels.length - 1);
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    var yValue = height - (YAxisLabels.PADDING_BOTTOM + spacing*i);
    var label = this._labels[i];
    context.fillStyle = label.fillStyle();
    context.fillRect(this._width, yValue-YAxisLabels.LINE_THICKNESS/2, canvas.width()-this._width,
      YAxisLabels.LINE_THICKNESS);
    label.draw(this._width-YAxisLabels.PADDING_RIGHT-label.width, yValue-label.height/2, context);
  }
};

// maxValue returns the maximum value of the YAxisLabels.
YAxisLabels.prototype.maxValue = function() {
  return this._maxValue;
};

// width returns the width of the YAxisLabels.
YAxisLabels.prototype.width = function() {
  return this._width;
};

YAxisLabels.prototype._add = function(labels) {
  for (var i = 0, len = labels._labels.length; i < len; ++i) {
    this._labels.push(labels._labels[i].copy());
  }
  this._labels.sort(function(a, b) {
    return a.value - b.value;
  });
  this._removeRedundantLabels();
};

YAxisLabels.prototype._copy = function() {
  var res = Object.create(YAxisLabels.prototype);
  res._labels = [];
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    res._labels[i] = this._labels[i].copy();
  }
  return res;
};

YAxisLabels.prototype._maxLabelValue = function() {
  return this._labels[this._labels.length-1].value;
};

YAxisLabels.prototype._removeRedundantLabels = function() {
  for (var i = 1; i < this._labels.length; ++i) {
    if (this._labels[i-1].value === this._labels[i].value) {
      this._labels.splice(i, 1);
      this._labels[i-1].opacity = 1;
      --i;
    }
  }
};

YAxisLabels.prototype._setOpacity = function(opacity) {
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    this._labels[i].opacity = opacity;
  }
};

// YAxisLabelsAnimation runs an animation between a start YLabels and an end YLabels.
function YAxisLabelsAnimation(start, end) {
  Animation.call(this);
  this._startLabels = start;
  this._endLabels = end;
}

YAxisLabelsAnimation.prototype = Object.create(Animation.prototype);

// labels returns the current YLabels.
YAxisLabelsAnimation.prototype.labels = function() {
  return YAxisLabels.intermediate(this._startLabels, this._endLabels, this.progress());
};

// setEndLabels updates the state to which the animation is going.
YAxisLabelsAnimation.prototype.setEndLabels = function(newLabels) {
  this._endLabels = newLabels;
};
