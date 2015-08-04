//deps scroll_bar.js graph_canvas.js animation.js event_emitter.js

// A ScrollView facilitates scrolling through abstract content.
function ScrollView(graphCanvas) {
  this._graphCanvas = graphCanvas;

  this._scrolls = false;
  this._animation = null;

  this._scrollBar = new ScrollBar();

  this._element = document.createElement('div');
  this._element.style.position = 'relative';
  this._element.style.overflow = 'hidden';

  this._element.appendNode(this._graphCanvas.element());
  this._element.appendNode(this._scrollBar.element());

  this._graphCanvas.element().style.width = '100%';
  this._graphCanvas.element().style.height = '100%';
}

ScrollView.BAR_MARGIN = 5;
ScrollView.SHOW_HIDE_DURATION = 0.4;

// element returns the root element for the ScrollView.
ScrollView.prototype.element = function() {
  return this._element;
};

// getScrollBar returns the ScrollBar.
ScrollView.prototype.getScrollBar = function() {
  return this._scrollBar;
};

// getScrolls returns whether or not the ScrollView is set to show the ScrollBar.
ScrollView.prototype.getScrolls = function() {
  return this._scrolls;
};

// layout adjusts the contained GraphCanvas and ScrollBar to fit the root element's bounds.
// This will layout the GraphCanvas.
ScrollView.prototype.layout = function() {
  var percentShowing = this._percentShowingBar();

  var graphElement = this._graphCanvas.element();
  var barElement = this._scrollBar.element();

  if (percentShowing === 0) {
    graphElement.style.height = '100%';
    barElement.style.top = '100%';
  } else if (percentShowing === 1) {
    graphElement.style.height = 'calc(100% - ' + formatPixels(ScrollView.BAR_MARGIN +
      ScrollBar.HEIGHT) + ')';
    barElement.style.bottom = '0';
  } else {
    var offset = (ScrollView.BAR_MARGIN + ScrollBar.HEIGHT) * percentShowing;
    graphElement.style.height = 'calc(100% - ' + formatPixels(offset) + ')';
    barElement.style.bottom = formatPixels(-ScrollBar.HEIGHT * (1 - offset));
  }

  this._graphCanvas.layout();
};

// setScrolls sets whether or not the ScrollBar should be visible.
// This may cause an animation.
ScrollView.prototype.setScrolls = function(s) {
  this._scrolls = s;
  if (this._animation === null && !this._useAnimation()) {
    this.layout();
    return;
  }

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
  this._animation.on('progress', this.layout.bind(this));
  this._animation.start();
};

ScrollView.prototype._percentShowingBar = function() {
  if (this._animation === null) {
    return this._scrolls ? 1 : 0;
  } else {
    return this._animation.value();
  }
};

ScrollView.prototype._useAnimation = function() {
  // TODO: return false if the graph is not visible.
  return true;
};
