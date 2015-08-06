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
