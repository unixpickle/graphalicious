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

function ScrollBar(scrollView) {
  EventEmitter.call(this);

  this._scrollView = scrollView;

  this._color = ScrollBar.DEFAULT_COLOR;
  this._colorAnimation = null;

  this._viewportToContentRatio = 0.5;
  this._animation = null;

  this._amountScrolled = 1;
}

ScrollBar.HEIGHT = 5;
ScrollBar.ANIMATION_DURATION = 0.4;
ScrollBar.COLOR_ANIMATION_DURATION = 0.4;
ScrollBar.BACKGROUND_COLOR = '#ccc';
ScrollBar.DEFAULT_COLOR = [0x64, 0xbc, 0xd4];
ScrollBar.MINIMUM_BAR_WIDTH = 10;

ScrollBar.prototype = Object.create(EventEmitter.prototype);

ScrollBar.prototype.draw = function(viewport) {
  viewport.enter();
  var context = viewport.context();

  context.fillStyle = ScrollBar.BACKGROUND_COLOR;
  context.fillRect(0, 0, viewport.width(), viewport.height());

  var barWidth = Math.max(viewport.width()*this._currentViewportToContentRatio,
    ScrollBar.MINIMUM_BAR_WIDTH);
  var barX = this._amountScrolled * (viewport.width() - barWidth);

  context.fillStyle = this._colorStyle();
  context.rect(barX, 0, barWidth, viewport.height());

  viewport.leave();
};

ScrollBar.prototype.getAmountScrolled = function() {
  return this._amountScrolled;
};

ScrollBar.prototype.setAmountScrolled = function(amount) {
  this._amountScrolled = amount;
  this.emit('redraw');
};

ScrollBar.prototype.setColor = function(color) {
  if (this._colorAnimation !== null || this._scrollView.useAnimation()) {
    this._colorAnimation = new VectorAnimation(ScrollBar.COLOR_ANIMATION_DURATION, this._color,
      color);
    this._color = color;
    this._colorAnimation.on('progress', this.emit.bind(this, 'redraw'));
    this._colorAnimation.on('draw', function() {
      this._colorAnimation = null;
    }.bind(this));
    this._colorAnimation.start();
  } else {
    this._color = color;
    this.emit('redraw');
  }
};

ScrollBar.prototype.setViewportToContentRatio = function(ratio) {
  if (ratio === this._viewportToContentRatio) {
    return;
  }
  if (this._animation !== null || this._scrollView.useAnimation()) {
    this._animation = new ValueAnimation(ScrollBar.ANIMATION_DURATION,
      this._currentViewportToContentRatio(), ratio);
    this._viewportToContentRatio = ratio;
    this._animation.on('progress', this.emit.bind(this, 'redraw'));
    this._animation.on('done', function() {
      this._animation = null;
    }.bind(this));
    this._animation.start();
  } else {
    this._viewportToContentRatio = ratio;
    this.emit('redraw');
  }
};

ScrollBar.prototype._colorStyle = function() {
  var color = this._currentColor();
  var res = 'rgba(';
  for (var i = 0; i < 3; ++i) {
    if (i != 0) {
      res += ', ';
    }
    res += Math.round(color[i]);
  }
  return res + ', 1)';
};

ScrollBar.prototype._currentColor = function() {
  if (this._colorAnimation !== null) {
    return this._colorAnimation.vector();
  } else {
    return this._color;
  }
};

ScrollBar.prototype._currentViewportToContentRatio = function() {
  if (this._animation !== null) {
    return this._animation.value();
  } else {
    return this._viewportToContentRatio;
  }
};

function parseHexColor(hexColor) {
  if (hex[0] !== '#' || hex.length != 7) {
    return ScrollBar.DEFAULT_COLOR;
  }
  var res = [];
  for (var i = 0; i < 3; ++i) {
    var val = parseInt(hex.substr(1 + 2*i, 2), 16);
    if (isNaN(val)) {
      return ScrollBar.DEFAULT_COLOR;
    }
    res[i] = val;
  }
  return res;
}
