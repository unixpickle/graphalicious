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

// YLabels lays out y-axis labels and spaces them appropriately.
function YLabels(outerHeight, height, maxValue, content) {
  this._height = height;
  this._width = 0;
  this._textValues = [];
  this._textYValues = [];

  var topLabelSize = measureLabel(content.formatYLabel(maxValue), content);
  var bottomLabelSize = measureLabel(content.formatYLabel(0), content);

  var labelHeight = Math.max(topLabelSize.height, bottomLabelSize.height);
  var count = Math.floor((outerHeight - YLabels.MIN_LABEL_SPACE) /
    (labelHeight + YLabels.MIN_LABEL_SPACE));

  if (count < 2) {
    return;
  }

  var valueDifference = maxValue / (count - 1);
  for (var i = 0; i < count; ++i) {
    var labelText = content.formatYLabel(i*valueDifference);
    var metrics = measureLabel(labelText, content);
    this._width = Math.max(this._width, metrics.width);
    this._textValues.push(labelText);

    var spacing = height / (count-1);
    var midYValue = height - (spacing/2 + spacing*i);
    this._textYValues.push(midYValue + metrics.height/2);
  }
}

YLabels.MIN_LABEL_SPACE = 10;

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
