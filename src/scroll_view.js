//deps event_emitter.js

// ScrollView provides the user interface for scrolling around within content.
function ScrollView(canvas, colorScheme) {
  EventEmitter.call(this);

  this._canvas = canvas;
  this._colorScheme = colorScheme;

  this._drawSetsToTrue = false;

  this._scrollbarAnimation = null;
  this._scrolls = false;

  this._offscreenWidth = 0;
  this._contentWidth = 0;
  this._amountScrolled = 0;

  this._registerEvents();
}

ScrollView.ANIMATION_DURATION = 0.4;
ScrollView.BAR_BACKGROUND_COLOR = '#ccc';
ScrollView.MIN_SCROLLBAR_SIZE = 20;
ScrollView.SCROLLBAR_HEIGHT = 5;
ScrollView.SCROLLBAR_MARGIN = 5;

ScrollView.prototype = Object.create(EventEmitter.prototype);

// contentViewport returns a Viewport into which content may be drawn.
ScrollView.prototype.contentViewport = function() {
  var mainViewport = this._canvas.viewport();
  var totalPossibleUsedHeight = ScrollView.SCROLLBAR_HEIGHT + ScrollView.SCROLLBAR_MARGIN;
  var usedHeight = Math.round(this._fractionShowingScrollbar() * totalPossibleUsedHeight);
  return mainViewport.containedViewport(0, 0, mainViewport.width(),
    mainViewport.height()-usedHeight);
};

// disableScrolling makes the ScrollView unscrollable.
// The scrollbar will be hidden and scroll-wheel events will be disabled.
ScrollView.prototype.disableScrolling = function() {
  if (!this._scrolls) {
    return;
  }
  if (this.getAnimationsEnabled() || this._scrollbarAnimation !== null) {
    this._animateScrollbar(0);
    this._scrolls = false;
  } else {
    this._scrolls = false;
    this._draw();
  }
};

// enableScrolling makes the ScrollView scrollable.
// In order to present the user with a scrollbar, it is necessary to provide two parameters.
// The contentWidth parameter specifies the width (in pixels) of the underlying content.
// The offscreenWidth parameter specifies the width (in pixels) of the part of the underlying
// content that is not visible at a given time. The scroll view can be scrolled to any point between
// 0 and offscreenWidth pixels.
ScrollView.prototype.enableScrolling = function(contentWidth, offscreenWidth) {
  this._contentWidth = contentWidth;
  this._offscreenWidth = offscreenWidth;
  if (this.getAnimationsEnabled() || this._scrollbarAnimation !== null) {
    this._animateScrollbar(1);
    this._scrolls = true;
  } else {
    this._scrolls = true;
    this._draw();
  }
};

// getAnimationsEnabled returns whether or not animations are enabled on the underlying canvas.
ScrollView.prototype.getAnimationsEnabled = function() {
  return this._canvas.getAnimationsEnabled();
};

// getPixelsScrolled returns the number of pixels that the content is offset from its leftmost
// position.
ScrollView.prototype.getPixelsScrolled = function() {
  return Math.round(this._offscreenWidth * this._amountScrolled);
};

// isScrollingEnabled returns a boolean indicating whether or not scrolling is enabled.
ScrollView.prototype.isScrollingEnabled = function() {
  return this._scrolls;
};

ScrollView.prototype._animateScrollbar = function(endVal) {
  var startVal = this._fractionShowingScrollbar();
  if (this._scrollbarAnimation !== null) {
    this._scrollbarAnimation.cancel();
  }

  var duration = Math.abs(startVal - endVal) * ScrollView.ANIMATION_DURATION;
  this._scrollbarAnimation = new ValueAnimation(duration, startVal, endVal);
  this._scrollbarAnimation.on('progress', this._draw.bind(this));
  this._scrollbarAnimation.on('done', function() {
    this._scrollbarAnimation = null;
    this._draw();
  }.bind(this));
  this._scrollbarAnimation.start();
};

ScrollView.prototype._computeScrollbarFrame = function(totalWidth) {
  var width = Math.round((1 - this._offscreenWidth/this._contentWidth) * totalWidth);
  if (width < ScrollView.MIN_SCROLLBAR_SIZE) {
    width = ScrollView.MIN_SCROLLBAR_SIZE;
  } else if (width + ScrollView.MIN_SCROLLBAR_SIZE > totalWidth) {
    width = totalWidth - ScrollView.MIN_SCROLLBAR_SIZE;
  }
  var maxX = totalWidth - width;
  return {
    x: Math.round(maxX * this._amountScrolled),
    width: width
  };
};

ScrollView.prototype._controlsDelegate = function() {
  return {
    element: function() {
      return this._canvas.element();
    }.bind(this),

    contentHeight: function() {
      return this.contentViewport().height();
    }.bind(this),

    scrollbarRect: function() {
      var frame = this._computeScrollbarFrame(this._canvas.width());
      frame.height = this._fractionShowingScrollbar() * ScrollView.SCROLLBAR_HEIGHT;;
      frame.y = this._canvas.height() - frame.height;
      return frame;
    }.bind(this),

    width: function() {
      return this._canvas.width();
    }.bind(this),

    maxPixelsScrolled: function() {
      return this._offscreenWidth;
    }.bind(this),

    scrolls: this.isScrollingEnabled.bind(this),
    getPixelsScrolled: this.getPixelsScrolled.bind(this),
    setPixelsScrolled: this._setPixelsScrolled.bind(this)
  };
};

ScrollView.prototype._draw = function() {
  this._drawSetsToTrue = true;

  var viewport = this._canvas.viewport();
  viewport.enter();
  viewport.context().clearRect(0, 0, viewport.width(), viewport.height());
  var scrollbarHeight = this._fractionShowingScrollbar() * ScrollView.SCROLLBAR_HEIGHT;
  if (scrollbarHeight > 0) {
    this._drawScrollbar(viewport.context(), viewport.height()-scrollbarHeight, viewport.width(),
      scrollbarHeight);
  }
  viewport.leave();

  this.emit('draw');
};

ScrollView.prototype._drawScrollbar = function(context, y, width, height) {
  var frame = this._computeScrollbarFrame(width);
  context.fillStyle = ScrollView.BAR_BACKGROUND_COLOR;
  context.fillRect(0, y, width, height);
  context.fillStyle = this._colorScheme.getPrimaryColor();
  context.fillRect(frame.x, y, frame.width, height);
};

ScrollView.prototype._fractionShowingScrollbar = function() {
  if (this._scrollbarAnimation === null) {
    return this._scrolls ? 1 : 0;
  } else {
    return this._scrollbarAnimation.value();
  }
};

ScrollView.prototype._layout = function() {
  this._drawSetsToTrue = false;
  this.emit('layout');

  // Sometimes a layout handler will do something to cause a _draw(). In those cases, we do not need
  // to do another draw here.
  if (!this._drawSetsToTrue) {
    this._draw();
  }
};

ScrollView.prototype._redrawScrollbar = function() {
  var scrollbarHeight = this._fractionShowingScrollbar() * ScrollView.SCROLLBAR_HEIGHT;
  if (scrollbarHeight > 0) {
    var intHeight = Math.ceil(scrollbarHeight);
    var viewport = this._canvas.viewport();
    viewport.enter();
    viewport.context().clearRect(0, viewport.height()-intHeight, viewport.width(), intHeight);
    this._drawScrollbar(viewport.context(), viewport.height()-scrollbarHeight, viewport.width(),
      scrollbarHeight);
    viewport.leave();
  }
};

ScrollView.prototype._registerEvents = function() {
  this._canvas.on('layout', this._layout.bind(this));
  this._colorScheme.on('change', this._redrawScrollbar.bind(this));
  new ScrollViewControls(this._controlsDelegate());
};

ScrollView.prototype._setPixelsScrolled = function(pixels) {
  var oldAmount = this._amountScrolled;
  this._amountScrolled = Math.min(Math.max(pixels/this._offscreenWidth, 0), 1);
  if (oldAmount !== this._amountScrolled) {
    this._drawSetsToTrue = false;
    this.emit('scroll');
    if (!this._drawSetsToTrue) {
      this._redrawScrollbar();
    }
  }
};

function ScrollViewControls(delegate) {
  this._state = ScrollViewControls.STATE_DRAGGING_NOTHING;
  this._delegate = delegate;

  // this._dragInitialX is set to the clientX coordinate of the last _handleEventStart.
  this._dragInitialX = 0;

  // this._dragInitialValue has two different meanings depending on the state.
  // In STATE_DRAGGING_CONTENT, this is the number of pixels scrolled in the last _handleEventStart.
  // In STATE_DRAGGING_BAR, this is the x coordinate of the scrollbar in the last _handleEventStart.
  this._dragInitialValue = 0;

  // this._dragShielding is used to block :hover selectors while the user is dragging the scrollbar.
  this._dragShielding = document.createElement('div');
  this._dragShielding.style.position = 'fixed';
  this._dragShielding.style.left = '0';
  this._dragShielding.style.top = '0';
  this._dragShielding.style.width = '100%';
  this._dragShielding.style.height = '100%';

  this._registerMouseEvents();
  this._registerTouchEvents();
  this._registerWheelEvents();
}

ScrollViewControls.STATE_DRAGGING_NOTHING = 0;
ScrollViewControls.STATE_DRAGGING_CONTENT = 1;
ScrollViewControls.STATE_DRAGGING_BAR = 2;

ScrollViewControls.prototype._centerScrollbarAroundPoint = function(relative, scrollbarRect) {
  var maxX = this._delegate.width() - scrollbarRect.width;
  var useX = Math.min(Math.max(relative.x-scrollbarRect.width/2, 0), maxX);
  var pixels = Math.round(this._delegate.maxPixelsScrolled() * useX / maxX);
  this._delegate.setPixelsScrolled(pixels);
};

ScrollViewControls.prototype._handleEventStart = function(coords) {
  if (!this._delegate.scrolls()) {
    return;
  }

  var relative = this._relativeXY(coords);
  var scrollbarRect = this._delegate.scrollbarRect();
  if (relative.y < this._delegate.contentHeight()) {
    this._state = ScrollViewControls.STATE_DRAGGING_CONTENT;
    this._dragInitialValue = this._delegate.getPixelsScrolled();
    this._startShielding();
  } else if (relative.y >= scrollbarRect.y) {
    if (relative.x < scrollbarRect.x || relative.x >= scrollbarRect.x + scrollbarRect.width) {
      this._centerScrollbarAroundPoint(relative, scrollbarRect);
      scrollbarRect = this._delegate.scrollbarRect();
    }
    this._state = ScrollViewControls.STATE_DRAGGING_BAR;
    this._dragInitialValue = scrollbarRect.x;
    this._startShielding();
  }
  this._dragInitialX = coords.x;
};

ScrollViewControls.prototype._handleEventMove = function(coords) {
  if (!this._delegate.scrolls() || this._state === ScrollViewControls.STATE_DRAGGING_NOTHING) {
    return;
  } else if (this._state === ScrollViewControls.STATE_DRAGGING_CONTENT) {
    this._delegate.setPixelsScrolled(this._dragInitialValue + this._dragInitialX - coords.x);
  } else if (this._state === ScrollViewControls.STATE_DRAGGING_BAR) {
    var newBarX = this._dragInitialValue + coords.x - this._dragInitialX;
    var maxX = this._delegate.width() - this._delegate.scrollbarRect().width;
    var pixels = (newBarX / maxX) * this._delegate.maxPixelsScrolled();
    this._delegate.setPixelsScrolled(pixels);
  }
};

ScrollViewControls.prototype._handleEventEnd = function() {
  if (this._state !== ScrollViewControls.STATE_DRAGGING_NOTHING) {
    this._stopShielding();
    this._state = ScrollViewControls.STATE_DRAGGING_NOTHING;
  }
};

ScrollViewControls.prototype._relativeXY = function(point) {
  var canvasRect = this._delegate.element().getBoundingClientRect();
  return {
    x: point.x - canvasRect.left,
    y: point.y - canvasRect.top
  };
};

ScrollViewControls.prototype._registerMouseEvents = function() {
  this._delegate.element().addEventListener('mousedown', function(e) {
    this._handleEventStart({x: e.clientX, y: e.clientY});
  }.bind(this));
  document.body.addEventListener('mousemove', function(e) {
    this._handleEventMove({x: e.clientX, y: e.clientY});
  }.bind(this));
  document.body.addEventListener('mouseup', this._handleEventEnd.bind(this));
  document.body.addEventListener('mouseleave', this._handleEventEnd.bind(this));
};

ScrollViewControls.prototype._registerTouchEvents = function() {
  if (!('ontouchstart' in document)) {
    return;
  }
  var e = this._delegate.element();
  e.addEventListener('touchstart', function(e) {
    this._handleEventStart({x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY});
  }.bind(this));
  e.addEventListener('touchmove', function(e) {
    this._handleEventMove({x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY});
  }.bind(this));
  e.addEventListener('touchend', this._handleEventEnd.bind(this));
  e.addEventListener('touchcancel', this._handleEventEnd.bind(this));
};

ScrollViewControls.prototype._registerWheelEvents = function() {
  // Join wheel events to go along with requestAnimationFrame. Otherwise they will come in at too
  // high a frequency in Safari on OS X.
  var pendingDelta = 0;
  var pendingRequest = false;
  this._delegate.element().addEventListener('wheel', function(e) {
    if (!this._delegate.scrolls()) {
      return;
    }
    if (!pendingRequest) {
      pendingRequest = true;
      requestAnimationFrame(function() {
        this._delegate.setPixelsScrolled(this._delegate.getPixelsScrolled() - pendingDelta);
        pendingDelta = 0;
        pendingRequest = false;
      }.bind(this));
    }
    pendingDelta -= e.deltaX;
    e.preventDefault();
  }.bind(this));
};

ScrollViewControls.prototype._startShielding = function() {
  document.body.appendChild(this._dragShielding);
};

ScrollViewControls.prototype._stopShielding = function() {
  document.body.removeChild(this._dragShielding);
};

exports.ScrollView = ScrollView;
