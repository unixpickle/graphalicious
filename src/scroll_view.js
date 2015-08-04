//deps scrollbar.js graph_canvas.js viewport.js animation.js event_emitter.js

// A ScrollView facilitates scrolling through abstract content.
function ScrollView(graphCanvas, content) {
  this._graphCanvas = graphCanvas;
  this._content = content;

  this._showingScrollbar = false;
  this._animation = null;

  this._scrollBar = new ScrollBar(this);

  this._registerEvents();
}

ScrollView.BAR_MARGIN = 5;
ScrollView.SHOW_HIDE_DURATION = 0.4;

ScrollView.prototype.useAnimation = function() {
  // TODO: return false if the graph is not visible.
  return true;
};

ScrollView.prototype._draw = function() {
  var pct = this._percentShowingScrollbar();
  var height = this.height();

  var fullViewport = new Viewport(this._graphCanvas);
  var contentHeight = Math.round(height - pct*(ScrollBar.HEIGHT+ScrollView.BAR_MARGIN));
  if (contentHeight < 0) {
    return;
  }
  var contentViewport = fullViewport.containedViewport(0, 0, fullViewport.width(), contentHeight);
  this._content.draw(contentViewport);

  if (pct > 0) {
    var showingHeight = Math.ceil(pct * ScrollBar.HEIGHT);
    var barViewport = fullViewport.containedViewport(0, fullViewport.height()-showingHeight,
      fullViewport.width(), showingHeight);
    this._scrollBar.draw(barViewport);
  }
};

ScrollView.prototype._layout = function() {
  if (this._graphCanvas.height() <= ScrollBar.HEIGHT+ScrollView.BAR_MARGIN ||
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
  if (this._animation !== null || this.useAnimation()) {
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
    this._animation.start();
  } else {
    this._layout();
  }
};

ScrollView.prototype._registerEvents = function() {
  this._graphCanvas.on('layout', this._layout.bind(this));
  this._content.on('change', this._layout.bind(this));
  this._scrollBar.on('redraw', this._layout.bind(this));
};
