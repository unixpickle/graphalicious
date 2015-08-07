// YStage is a stage which presents content with y-axis labels but no x-axis labels.
function YStage(scrollView, content) {
  this._scrollView = scrollView;
  this._content = content;

  // this._leftmostLabelsWidth is the width of the labels when scrolled all the way to the left.
  // This is cached because various internal methods use it.
  this._leftmostLabelsWidth = null;

  this._animation = null;
  this._labels = null;

  // By default, the scroll view should be scrolled all the way to the right.
  this._scrollView.getScrollBar().setAmountScrolled(1);

  this._registerEvents();
  this._layout();
}

YStage.prototype._currentLabels = function() {
  return this._animation !== null ? this._animation.labels() : this._labels;
};

YStage.prototype._draw = function() {
  var canvas = this._scrollView.getGraphCanvas();

  canvas.context().clearRect(0, 0, canvas.width(), canvas.height());

  var labels = this._currentLabels();
  labels.draw(canvas.height(), canvas);

  var leftOffset = this._pixelsScrolled() - this._leftmostLabelsWidth + labels.width();
  var contentWidth = canvas.width() - labels.width();
  var maxValue = this._content.maxValueInFrame(leftOffset, contentWidth);
  var labelHeightRatio = maxValue / labels.maxValue();
  var contentHeight = Math.round(labelHeightRatio * (canvas.height()-YAxisLabels.PADDING_TOP-
    YAxisLabels.PADDING_BOTTOM));
  var contentY = canvas.height() - YAxisLabels.PADDING_BOTTOM - contentHeight;

  this._content.draw(leftOffset, new Viewport(this._scrollView.getGraphCanvas(), labels.width(),
    contentY, contentWidth, contentHeight));
};

YStage.prototype._layout = function() {
  var minWidth = this._content.minWidth();
  var leftmostMaxValue = this._content.maxValueInFrame(0, this._scrollView.width());
  this._leftmostLabelsWidth = YAxisLabels.createForContent(leftmostMaxValue, this._content,
    this._scrollView.height()).width();
  var offscreenAmount = minWidth - (this._scrollView.width() - this._leftmostLabelsWidth);
  if (offscreenAmount > 0) {
    this._scrollView.setScrolls(true);
    this._scrollView.setTotalInvisibleWidth(offscreenAmount);
    this._scrollView.getScrollBar().setKnobSize(1 - (offscreenAmount/minWidth));
  } else {
    this._scrollView.setScrolls(false);
  }

  this._recomputeLabels();
  this._draw();
};

YStage.prototype._pixelsScrolled = function() {
  return this._scrollView.getScrollBar().getAmountScrolled() *
    this._scrollView.getTotalInvisibleWidth();
};

YStage.prototype._recomputeLabels = function() {
  var frame = this._visibleFrameOfContent();
  var maxValue = this._content.maxValueInFrame(frame.x, frame.width);
  var labels = YAxisLabels.createForContent(maxValue, this._content,
    this._scrollView.element().offsetHeight);

  if (this._animation !== null) {
    this._animation.setEndLabels(labels);
    this._labels = labels;
  } else if (this._labels === null) {
    this._labels = labels;
  } else if (!labels.equals(this._labels)) {
    this._animation = new YAxisLabelsAnimation(this._labels, labels);
    this._animation.on('progress', this._draw.bind(this));
    this._animation.on('done', function() {
      this._animation = null;
      this._draw();
    }.bind(this));
    this._animation.start();
    this._labels = labels;
  }
};

YStage.prototype._registerEvents = function() {
  this._scrollView.on('change', this._layout.bind(this));
  this._content.on('change', this._layout.bind(this));
  this._scrollView.getGraphCanvas().on('layout', this._layout.bind(this));
};

YStage.prototype._visibleFrameOfContent = function() {
  if (!this._scrollView.getScrolls()) {
    return {x: 0, width: this._scrollView.width() - this._leftmostLabelsWidth};
  }

  return {
    x: Math.max(0, this._pixelsScrolled() - this._leftmostLabelsWidth),
    width: this._scrollView.width()
  };
};

exports.YStage = YStage;
