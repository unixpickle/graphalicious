// A ScrollView facilitates scrolling through abstract content.
function ScrollView(graphView, content) {
  this._graphView = graphView;
  this._content = content;

  this._showingScrollbar = this._needsToScroll();
  this._animation = null;

  this._registerEvents();
}

ScrollView.HEIGHT = 5;
ScrollView.MARGIN = 5;

ScrollView.prototype._draw = function() {
  // TODO: draw the scrollbar and the content here.
};

ScrollView.prototype._layout = function() {
  this._recomputeState();
  this._draw();
  // TODO: the rest of this.
};

ScrollView.prototype._needsToScroll = function() {
  return this._content.minWidth() > this._graphView.width();
};

ScrollView.prototype._recomputeState = function() {
  var s = this._needsToScroll();
  if (s !== this._showingScrollbar) {
    // TODO: reverse the animation if there is one.
  }
};

ScrollView.prototype._registerEvents = function() {
  this._graphView.on('layout', this._layout.bind(this));
  this._content.on('change', this._layout.bind(this));
};
