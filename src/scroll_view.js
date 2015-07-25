// A ScrollView facilitates scrolling through abstract content.
function ScrollView(graphView, content) {
  this._graphView = graphView;
  this._content = content;

  this._hasLaidOutBefore = false;
  this._showingScrollbar = false;
  this._animation = null;

  this._registerEvents();
}

ScrollView.HEIGHT = 5;
ScrollView.MARGIN = 5;
ScrollView.SHOW_HIDE_DURATION = 0.4;

ScrollView.prototype._draw = function() {
  // TODO: draw the scrollbar and the content here.
};

ScrollView.prototype._layout = function() {
  if (this._graphView.width() <= 0 || this._graphView.height() <= 0) {
    return;
  } else if (!this._hasLaidOutBefore) {
    this._hasLaidOutBefore = true;
    this._content.initializeWithWidth(this._graphView.width());
    this._showingScrollbar = this._needsToScroll();
  } else {
    this._recomputeState();
  }
  this._draw();
};

ScrollView.prototype._needsToScroll = function() {
  return this._content.minWidth() > this._graphView.width();
};

ScrollView.prototype._recomputeState = function() {
  var s = this._needsToScroll();
  if (s === this._showingScrollbar) {
    return;
  }
  
  this._showingScrollbar = s;
  if (this._animation !== null || this._useAnimation()) {
    if (this._animation !== null) {
      this._animation.cancel();
      this._animation = this._animation.reverse();
    } else {
      var endState = (s ? 1 : 0);
      this._animation = new ValueAnimation(ScrollView.SHOW_HIDE_DURATION, 1-endState, endState);
    }
    this._animation.on('done', function() {
      this._animation = null;
    }.bind(this));
    this._animation.on('progress', this._layout.bind(this));
  } else {
    this._layout();
  }
};

ScrollView.prototype._registerEvents = function() {
  this._graphView.on('layout', this._layout.bind(this));
  this._content.on('change', this._layout.bind(this));
};

ScrollView.prototype._useAnimation = function() {
  // TODO: return false if the graph is not visible.
  return true;
};
