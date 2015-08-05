var textMeasurementLabel = null;

// YStage is a stage which presents content with y-axis labels but no x-axis labels.
function YStage(scrollView, content) {
  this._scrollView = scrollView;
  this._content = content;

  this._registerEvents();
  this._layout();
}

YStage.prototype._draw = function() {
  // TODO: here, draw the content at the scrolled part and compute the axis labels.
};

YStage.prototype._layout = function() {
  // TODO: here, figure out whether everything should scroll.
};

YStage.prototype._registerEvents = function() {
  this._scrollView.on('change', this._redraw);
  this._content.on('change', this._layout);
  this._scrollView.getGraphCanvas().on('layout', this._layout);
};

// YLabel represents a y-axis label.
function YLabel(value, content) {
  this.text = content.formatYLabel(value)
  var metrics = measureLabel(this.text, content);
  this.width = metrics.width;
  this.height = metrics.height;
  this.opacity = 1;
  this.x = 0;
  this.y = 0;
  this.fontFamily = content.getFontFamily();
  this.fontSize = content.getFontSize();
  this.fontWeight = content.getFontWeight();
}

// draw draws the y-axis label in a viewport.
YLabel.prototype.draw = function(viewport) {
  viewport.enter();
  var context = viewport.context();
  context.font = this.fontWeight + ' ' + this.fontSize + 'px ' + this.fontFamily;
  context.fillStyle = 'rgba(144, 144, 144, ' + formatAlpha(this.opacity) + ')';
  context.fillText(this.text, this.x, this.y-this.height/2);
  viewport.leave();
};

// YLabels lays out y-axis labels and spaces them appropriately.
function YLabels(outerHeight, height, maxValue, content) {
  var usableHeight = height - (YLabels.PADDING_TOP + YLabels.PADDING_BOTTOM);
  this._labels = [];
  if (usableHeight < 0) {
    return;
  }

  var firstLabel = new YLabel(0, content);
  var lastLabel = new YLabel(maxValue, content);
  firstLabel.y = height - YLabels.PADDING_BOTTOM;
  lastLabel.y = YLabels.PADDING_TOP;

  var labelHeight = Math.max(firstLabel.height, lastLabel.height);
  var labelCount = Math.floor((usableHeight+YLabels.MIN_LABEL_SPACE) /
    (labelHeight+YLabels.MIN_LABEL_SPACE));
  var labelSpacing = usableHeight / (labelCount - 1);

  this._labels.push(firstLabel);
  for (var i = 1; i < labelCount-1; ++i) {
    var label = new YLabel((maxValue/(labelCount-1))*i, content);
    label.y = firstLabel.y + labelSpacing;
  }
  this._labels.push(lastLabel);

  this._width = 0;
  for (var i = 0, len = this._labels.length; i < len; ++i) {
    this._width = Math.max(this._labels[i].width+YLabels.PADDING_LEFT+YLabels.PADDING_RIGHT,
      this._width);
  }

  for (var i = 0, len = this._labels.length; i < len; ++i) {
    var label = this._labels[i];
    label.x = this._width - (YLabels.PADDING_RIGHT + label.width);
  }
}

YLabels.MIN_LABEL_SPACE = 30;
YLabels.PADDING_BOTTOM = 15;
YLabels.PADDING_LEFT = 5;
YLabels.PADDING_RIGHT = 5;
YLabels.PADDING_TOP = 20;

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
