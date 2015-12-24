// InstantaneousState stores various characteristics of a YLCV at an instant in time.
// This is useful for keeping track of pre- and post- animation states and transitioning
// between them.
function InstantaneousState(yLabels, scrollState, leftmostLabels) {
  this._yLabels = yLabels;
  this._scrollState = scrollState;
  this._leftmostLabels = leftmostLabels;
}

InstantaneousState.prototype.getYLabels = function() {
  return this._yLabels;
};

InstantaneousState.prototype.getScrollState = function() {
  return this._scrollState;
};

InstantaneousState.prototype.getLeftmostLabels = function() {
  return this._leftmostLabels;
};

InstantaneousState.prototype.copyWithScrollState = function(s) {
  return new InstantaneousState(this._yLabels, s, this._leftmostLabels);
};

InstantaneousState.prototype.copyWithYLabels = function(y) {
  return new InstantaneousState(y, this._scrollState, this._leftmostLabels);
};

InstantaneousState.prototype.transitionFrame = function(end, progress, currentWidth) {
  var labels;
  if (this._yLabels === null || end._yLabels === null) {
    labels = this._yLabels || end._yLabels;
  } else {
    labels = this._yLabels.transitionFrame(end._yLabels, progress);
  }

  var leftmost;
  if (this._leftmostLabels === null || end._leftmostLabels === null) {
    leftmost = this._leftmostLabels || end._leftmostLabels;
  } else {
    leftmost = this._leftmostLabels.transitionFrame(end._leftmostLabels, progress);
  }

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

  return new InstantaneousState(labels, scrollState, leftmost);
};
