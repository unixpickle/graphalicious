//deps scroll_bar.js graph_canvas.js animation.js event_emitter.js formatting.js

// A ScrollView facilitates scrolling through abstract content.
// The ScrollView will emit 'change' events whenever it is scrolled.
function ScrollView(graphCanvas) {
  EventEmitter.call(this);

  this._graphCanvas = graphCanvas;

  this._scrolls = false;
  this._animation = null;

  this._scrollBar = new ScrollBar();
  this._scrollBar.on('change', this.emit.bind(this, 'change'));

  this._element = document.createElement('div');
  this._element.style.position = 'relative';
  this._element.style.overflow = 'hidden';

  this._element.appendChild(this._graphCanvas.element());
  this._element.appendChild(this._scrollBar.element());

  this._graphCanvas.element().style.width = '100%';
  this._graphCanvas.element().style.height = '100%';

  this._totalInvisibleWidth = 0;

  this._registerDragEvents();
}

ScrollView.BAR_MARGIN = 5;
ScrollView.SHOW_HIDE_DURATION = 0.4;

ScrollView.prototype = Object.create(EventEmitter.prototype);

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

// getTotalInvisibleWidth returns the last value set by setTotalWidth.
ScrollView.prototype.getTotalInvisibleWidth = function() {
  return this._totalWidth;
};

// layout adjusts the contained GraphCanvas and ScrollBar to fit the root element's bounds.
// This will layout the GraphCanvas.
ScrollView.prototype.layout = function() {
  var percentShowing = this._percentShowingBar();

  var graphElement = this._graphCanvas.element();
  var barElement = this._scrollBar.element();

  if (percentShowing === 0) {
    graphElement.style.height = '100%';
    barElement.style.bottom = formatPixels(-ScrollBar.HEIGHT);
  } else if (percentShowing === 1) {
    graphElement.style.height = 'calc(100% - ' + formatPixels(ScrollView.BAR_MARGIN +
      ScrollBar.HEIGHT) + ')';
    barElement.style.bottom = '0';
  } else {
    var offset = (ScrollView.BAR_MARGIN + ScrollBar.HEIGHT) * percentShowing;
    graphElement.style.height = 'calc(100% - ' + formatPixels(offset) + ')';
    barElement.style.bottom = formatPixels(-ScrollBar.HEIGHT * (1 - percentShowing));
  }

  this._graphCanvas.layout();
  this._scrollBar.layout();
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
    this._animation = this._animation.reversed();
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

// setTotalInvisibleWidth tells the ScrollView how wide the underlying content is (in pixels).
// This makes drag-scrolling work the way the user expects.
ScrollView.prototype.setTotalInvisibleWidth = function(pixels) {
  this._totalInvisibleWidth = pixels;
};

ScrollView.prototype._dragged = function(initialAmountScrolled, offset) {
  if (this._totalInvisibleWidth <= 0 || !this._scrolls) {
    return;
  }
  var fraction = Math.max(Math.min(initialAmountScrolled - offset/this._totalInvisibleWidth, 1), 0);
  if (fraction !== this._scrollBar.getAmountScrolled()) {
    this._scrollBar.setAmountScrolled(fraction);
    this.emit('change');
  }
};

ScrollView.prototype._percentShowingBar = function() {
  if (this._animation === null) {
    return this._scrolls ? 1 : 0;
  } else {
    return this._animation.value();
  }
};

ScrollView.prototype._registerDragEvents = function() {
  var e = this._graphCanvas.element();
  if ('ontouchstart' in document) {
    var initialAmountScrolled;
    var initialX;
    e.addEventListener('ontouchstart', function(e) {
      initialX = e.changedTouches[0].pageX;
      initialAmountScrolled = this._scrollBar.getAmountScrolled();
    }.bind(this));
    e.addEventListener('ontouchmove', function(e) {
      this._dragged(initialAmountScrolled, e.changedTouches[0].pageX-initialX);
    }.bind(this));
  }

  var shielding = document.createElement('div');
  shielding.style.position = 'fixed';
  shielding.style.left = '0';
  shielding.style.top = '0';
  shielding.style.width = '100%';
  shielding.style.height = '100%';

  var mouseInitialAmountScrolled;
  var mouseInitialX;
  var mouseDown = false;

  e.addEventListener('mousedown', function(e) {
    mouseDown = true;
    mouseInitialX = e.clientX;
    mouseInitialAmountScrolled = this._scrollBar.getAmountScrolled();

    // NOTE: this prevents hover events on the left of the page while dragging.
    document.body.appendChild(shielding);

    // NOTE: this line of code prevents the cursor from changing on drag in Safari on OS X.
    // It may have the same effect on other platforms as well.
    e.preventDefault();
  }.bind(this));
  document.body.addEventListener('mousemove', function(e) {
    if (mouseDown) {
      this._dragged(mouseInitialAmountScrolled, e.clientX-mouseInitialX);
    }
  }.bind(this));
  document.body.addEventListener('mouseup', function() {
    if (mouseDown) {
      mouseDown = false;
      document.body.removeChild(shielding);
    }
  });
};

ScrollView.prototype._useAnimation = function() {
  // TODO: return false if the graph is not visible.
  return true;
};

exports.ScrollView = ScrollView;
