function View() {
  this._scrollView = new window.scrollerjs.View(window.scrollerjs.View.BAR_POSITION_BOTTOM);
  this._contentView = null;
  this._animate = false;

  this._boundScrollingStateChanged = this._handleScrollingStateChanged.bind(this);
}

View.prototype.element = function() {
  return this._scrollView.element();
};

View.prototype.layout = function(width, height) {
  width = Math.ceil(width);
  height = Math.ceil(height);

  var e = this.element();
  e.style.width = width + 'px';
  e.style.height = height + 'px';
  this._scrollView.layout();

  if (this._contentView !== null) {
    this._contentView.layout(width, height);
  }
};

View.prototype.getAnimate = function() {
  return this._animate;
};

View.prototype.setAnimate = function(flag) {
  this._animate = flag;
  if (this._contentView !== null) {
    this._contentView.setAnimate(flag);
  }
};

View.prototype.getContentView = function() {
  return this._contentView;
};

View.prototype.setContentView = function(cv) {
  if (this._contentView !== null) {
    if (this._animate) {
      this._contentView.setAnimate(false);
    }
    this._contentView.removeListener('scrollingStateChange', this._boundScrollingStateChanged);
  }
  this._contentView = cv;
  this._contentView.on('scrollingStateChange', this._boundScrollingStateChanged);
  this._scrollView.setContent(cv.element());
  this._contentView.setAnimate(this._animate);
  this._contentView.layout(this.element().offsetWidth, this.element().offsetHeight);
};

View.prototype._handleScrollingStateChanged = function() {
  assert(this._contentView !== null);
  var state = this._contentView.getScrollingState();
  this._scrollView.setState(state);
};
