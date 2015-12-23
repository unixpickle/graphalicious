// InstantaneousState stores various characteristics of a YLCV at an instant in time.
// This is useful for keeping track of pre- and post- animation states and transitioning
// between them.
function InstantaneousState(yLabels, scrollState, leftmostWidth) {
  this._yLabels = yLabels;
  this._scrollState = scrollState;
  this._leftmostWidth = leftmostWidth;
}

InstantaneousState.prototype.getYLabels = function() {
  return this._yLabels;
};

InstantaneousState.prototype.getScrollState = function() {
  return this._scrollState;
};

InstantaneousState.prototype.getLeftmostWidth = function() {
  return this._leftmostWidth;
};

InstantaneousState.prototype.transitionFrame = function(end, progress, currentWidth) {
  var labels = this._yLabels.transitionFrame(end, progress);
  var leftmostWidth = progress*end.getLeftmostWidth() +
    (1-progress)*this.getLeftmostWidth();

  var scrollProg = progress;

  // NOTE: if the content is changing widths, we should use this
  // gradual change as a cue for scroll state changes.
  if (end.getScrollState().getTotalPixels() !== this.getScrollState().getTotalPixels()) {
    var totalWidthDiff = end.getScrollState().getTotalPixels() -
      this.getScrollState().getTotalPixels();
    scrollProg = (currentWidth - this.getScrollState().getTotalPixels()) / totalWidthDiff;
  }

  var visible = scrollProg*end.getScrollState().getVisiblePixels() +
    (1-scrollProg)*this.getScrollState().getVisiblePixels();
  var scrolled = scrollProg*end.getScrollState().getScrolledPixels() +
    (1-scrollProg)*this.getScrollState().getScrolledPixels();

  var scrollState = new window.scrollerjs.State(currentWidth, visible, scrolled);

  return new InstantaneousState(labels, scrollState, leftmostWidth);
};
