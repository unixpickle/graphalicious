// A ScrollView facilitates scrolling through abstract content.
function ScrollView(graphCanvas, content) {
  this._graphCanvas = graphCanvas;
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
  var pct = this._percentShowingScrollbar();
  var height = this.height();

  var fullViewport = new Viewport(this._graphCanvas);
  var contentHeight = Math.round(height - pct*(ScrollView.HEIGHT+ScrollView.MARGIN));
  if (contentHeight < 0) {
    return;
  }
  var contentViewport = fullViewport.containedViewport(0, 0, this.width(), contentHeight);
  this._content.draw(contentViewport);

  // TODO: here, draw the actual scrollbar.
};

ScrollView.prototype._layout = function() {
  if (this._graphCanvas.height() <= ScrollView.HEIGHT+ScrollView.MARGIN ||
      this._graphCanvas.width() <= 0) {
    return;
  }
  this._content.canvasSize(this._graphCanvas.width(), this._graphCanvas.height());
  this._recomputeState();
  this._draw();
};

ScrollView.prototype._needsToScroll = function() {
  return this._content.minWidth() > this._graphCanvas.width();
};

ScrollView.prototype._percentShowingBar = function() {
  if (this._animation === null) {
    return this._showingScrollbar ? 1 : 0;
  } else {
    return this._animation.value();
  }
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
  this._graphCanvas.on('layout', this._layout.bind(this));
  this._content.on('change', this._layout.bind(this));
};

ScrollView.prototype._useAnimation = function() {
  // TODO: return false if the graph is not visible.
  return true;
};
