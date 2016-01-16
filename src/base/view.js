function View(harmonizerContext) {
  this._harmonizerContext = harmonizerContext || window.harmonizer.defaultContext;

  this._scrollView = new window.scrollerjs.View(window.scrollerjs.View.BAR_POSITION_BOTTOM,
    this._harmonizerContext);
  this._contentView = null;
  this._animate = false;

  this._scrollView.setDraggable(true);
  this._boundScrollStateChanged = this._handleScrollStateChanged.bind(this);
  this._scrollView.on('scroll', this._handleScroll.bind(this));

  preventSelection(this._scrollView.element());
  this._registerMouseEvents();
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
    this._contentView.removeListener('scrollStateChange', this._boundScrollStateChanged);
  }
  this._contentView = cv;
  if (cv !== null) {
    this._contentView.on('scrollStateChange', this._boundScrollStateChanged);
    this._scrollView.setContent(cv.element());
    this._contentView.setAnimate(this._animate);
    this._contentView.layout(this.element().offsetWidth, this.element().offsetHeight);
    this._handleScrollStateChanged();
  }
};

View.prototype._handleScrollStateChanged = function() {
  assert(this._contentView !== null);
  var state = this._contentView.getScrollState();
  this._scrollView.setState(state);
};

View.prototype._handleScroll = function() {
  if (this._contentView !== null) {
    this._contentView.setScrolledPixels(this._scrollView.getState().getScrolledPixels());
  }
};

View.prototype._registerMouseEvents = function() {
  var mousePosition = null;
  var harmonizer = new window.harmonizer.Harmonizer(this._harmonizerContext);

  harmonizer.makeSingleShot(function() {
    if (this._contentView !== null) {
      if (mousePosition !== null) {
        this._contentView.pointerMove(mousePosition);
      } else {
        this._contentView.pointerLeave();
      }
    }
  }.bind(this));

  this.element().addEventListener('mousemove', function(e) {
    var rect = this.element().getBoundingClientRect();
    mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    harmonizer.start();
  }.bind(this));

  this.element().addEventListener('mouseleave', function(e) {
    mousePosition = null;
    harmonizer.start();
  }.bind(this));

  this.element().addEventListener('click', function(e) {
    if (this._contentView !== null) {
      var rect = this.element().getBoundingClientRect();
      var pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      this._contentView.pointerClick(pos);
    }
  }.bind(this));
};

function preventSelection(element) {
  var s = element.style;
  s.webkitTouchCallout = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  s.msUserSelect = 'none';
  s.userSelect = 'none';
}

exports.View = View;
