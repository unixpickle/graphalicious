//deps draggable_view.js

// The View displays graph content.
function View(colorScheme) {
  this._element = document.createElement('div');
  this._element.style.position = 'relative';
  this._colorScheme = colorScheme;

  this._scrollBar = new ScrollBar(colorScheme);
  this._element.appendChild(this._scrollBar.element());

  this._content = null;

  this._scrolls = false;
  this._animate = false;
  this._scrollBarAnimationStart = null;
  this._scrollBarAnimation = null;

  this._width = 0;
  this._height = 0;

  this._boundWidthChange = this._contentWidthChange.bind(this);
  this._boundDrawContent = this._drawContent.bind(this);
  this._scrollBar.on('change', this._handleScrolled.bind(this));

  this._registerScrollWheelEvents();

  DraggableView.call(this);
}

View.BAR_HEIGHT = 5;
View.BAR_SPACING = 5;
View.BAR_ANIMATION_DURATION = 400;

View.prototype = Object.create(DraggableView.prototype);

View.prototype.element = function() {
  return this._element;
};

View.prototype.layout = function(width, height) {
  this._element.style.width = Math.round(width) + 'px';
  this._element.style.height = Math.round(height) + 'px';

  if (width != this._width) {
    this._width = width;
    if (this._content !== null) {
      this._updateScrollBar(true);
    }
  }
  this._height = height;

  var barVisibility = this._scrollBarVisibility();
  this._scrollBar.layout(width, View.BAR_HEIGHT * barVisibility);

  if (this._content !== null) {
    this._drawContent(barVisibility);
  }
};

View.prototype.getContent = function() {
  return this._content;
};

View.prototype.setContent = function(content) {
  if (this._content !== null) {
    this._content.setAnimate(false);
    this._element.removeChild(this._content.element());
    this._content.removeListener('widthChange', this._boundWidthChange);
    this._content.removeListener('redraw', this._boundDrawContent);
  }

  this._content = content;

  if (this._content === null) {
    this._updateScrollBar(false);
    return;
  }

  this._content.setAnimate(this._animate);
  this._content.on('widthChange', this._boundWidthChange);
  this._content.on('redraw', this._boundDrawContent);
  this._element.appendChild(this._content.element());

  this._updateScrollBar(false);
  this._drawContent();
};

View.prototype.getAnimate = function() {
  return this._animate;
};

View.prototype.setAnimate = function(flag) {
  this._animate = flag;
  if (this._content !== null) {
    this._content.setAnimate(flag);
  }
};

View.prototype._contentWidthChange = function(keepRightOffset) {
  this._updateScrollBar(keepRightOffset);
  this._drawContent();
};

View.prototype._handleScrolled = function() {
  if (!this._scrolls) {
    return;
  }
  this._drawContent();
};

View.prototype._drawContent = function(barVisibility) {
  barVisibility = barVisibility || this._scrollBarVisibility();

  var viewportX = 0;
  if (this._scrolls) {
    viewportX = this._scrollBar.getScrolledPixels();
  }
  var height = this._height - barVisibility*(View.BAR_HEIGHT+View.BAR_SPACING);
  var barShowingHeight = this._height - (View.BAR_HEIGHT + View.BAR_SPACING);
  this._content.draw(viewportX, this._width, height, barShowingHeight);
};

View.prototype._updateScrollBar = function(keepRightOffset) {
  if (this._needsToScroll() === this._scrolls) {
    if (this._scrolls) {
      if (keepRightOffset) {
        var scrollRight = this._scrollBar.getTotalPixels() - this._scrollBar.getVisiblePixels() -
          this._scrollBar.getScrolledPixels();
        var scrolled = Math.max(0, this._content.totalWidth() - this._width - scrollRight);
        this._scrollBar.setInfo(this._content.totalWidth(), this._width, scrolled);
      } else {
        var maxScrolled = this._content.totalWidth() - this._width;
        var scrolled = Math.min(maxScrolled, this._scrollBar.getScrolledPixels());
        this._scrollBar.setInfo(this._content.totalWidth(), this._width, scrolled);
      }
    }
    return;
  }

  this._scrolls = !this._scrolls;

  if (this._scrolls) {
    // TODO: the content may have a preferred initial scroll offset.
    var scrolled = this._content.totalWidth() - this._width;
    this._scrollBar.setInfo(this._content.totalWidth(), this._width, scrolled);
  }

  if (!this._animate) {
    if (this._scrollBarAnimation !== null) {
      window.cancelAnimationFrame(this._scrollBarAnimation);
      this._scrollBarAnimation = null;
    }
    this._scrollBar.layout(this._width, View.BAR_HEIGHT * this._scrollBarVisibility());
    return;
  }

  var startTime = new Date().getTime();
  if (this._scrollBarAnimation !== null) {
    startTime -= View.BAR_ANIMATION_DURATION - (startTime - this._scrollBarAnimationStart);
    window.cancelAnimationFrame(this._scrollBarAnimation);
  }

  this._scrollBarAnimationStart = startTime;
  this._scrollBarAnimation = window.requestAnimationFrame(this._animationFrame.bind(this));
};

View.prototype._scrollBarVisibility = function(now) {
  if (this._scrollBarAnimation === null) {
    return (this._scrolls ? 1 : 0);
  }
  var elapsed = new Date().getTime() - this._scrollBarAnimationStart;
  var visibility = Math.max(0, Math.min(1, elapsed / View.BAR_ANIMATION_DURATION));
  if (this._scrolls) {
    return visibility;
  } else {
    return 1 - visibility;
  }
};

View.prototype._animationFrame = function() {
  var now = new Date().getTime();
  if (now < this._scrollBarAnimationStart) {
    // NOTE: if they change the system clock, don't let the animation run for minutes on end.
    this._animationStart = now;
  }
  if (now - this._scrollBarAnimationStart < View.BAR_ANIMATION_DURATION) {
    this._scrollBarAnimation = window.requestAnimationFrame(this._animationFrame.bind(this));
  } else {
    this._scrollBarAnimation = null;
  }
  this.layout(this._width, this._height);
};

View.prototype._needsToScroll = function() {
  if (this._content === null) {
    return false;
  }
  return this._content.totalWidth() > this._width;
};

View.prototype._addScrollValue = function(delta) {
  if (!this._scrolls) {
    return;
  }

  var total = this._scrollBar.getTotalPixels();
  var visible = this._scrollBar.getVisiblePixels();
  var oldScrollX = this._scrollBar.getScrolledPixels();
  var maxScrollX = total - visible;
  var newScrollX = Math.max(0, Math.min(maxScrollX, oldScrollX+delta));

  this._scrollBar.setInfo(total, visible, newScrollX);
  this._handleScrolled();
};

View.prototype._generateDragFunction = function(startX, startY) {
  // NOTE: dragging should not work in the space between the content and the scrollbar.
  var barVisibility = this._scrollBarVisibility();
  var contentHeight = this._height - barVisibility*(View.BAR_HEIGHT+View.BAR_SPACING);
  if (startY > this.element().getBoundingClientRect().top + contentHeight) {
    return null;
  }

  var startScrollX = this._scrollBar.getScrolledPixels();
  var lastX = startX;
  return function(x) {
    this._addScrollValue(lastX - x);
    lastX = x;
  }.bind(this);
};

View.prototype._registerScrollWheelEvents = function() {
  // Join wheel events to go along with requestAnimationFrame. Otherwise they will come in at too
  // high a frequency in Safari on OS X.
  var pendingDelta = 0;
  var pendingRequest = false;
  this._element.addEventListener('wheel', function(e) {
    if (!pendingRequest) {
      pendingRequest = true;
      window.requestAnimationFrame(function() {
        this._addScrollValue(pendingDelta);
        pendingDelta = 0;
        pendingRequest = false;
      }.bind(this));
    }
    pendingDelta += e.deltaX;
    e.preventDefault();
  }.bind(this));
};

exports.View = View;
