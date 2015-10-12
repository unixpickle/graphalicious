//deps event_emitter.js

// YLabelContentView draws a ViewProvider with y-axis labels.
function YLabelContentView(provider, dataSource, splashScreen) {
  EventEmitter.call(this);

  this._element = document.createElement('div');
  this._element.position = 'absolute';

  this._splashScreen = splashScreen;
  this._canvas = document.createElement('canvas');

  this._provider = provider;
  this._dataSource = dataSource;
  this._chunkView = null;

  this._state = YLabelContentView.STATE_LOADING;
  this._element.appendChild(splashScreen.element());
  splashScreen.setAnimate(false);

  this._animate = false;
  this._crystalCallback = this._pixelRatioChanged.bind(this);
}

YLabelContentView.STATE_LOADING = 0;
YLabelContentView.STATE_FAILED = 1;
YLabelContentView.STATE_SHOWING_CONTENT = 2;

YLabelContentView.prototype = Object.create(EventEmitter.prototype);

YLabelContentView.prototype.element = function() {
  return this._element;
};

YLabelContentView.prototype.totalWidth = function() {
  if (this._state === YLabelContentView.STATE_SHOWING_CONTENT) {
    return this._provider.getWidthApproximation();
  } else {
    return 0;
  }
};

YLabelContentView.prototype.setAnimate = function(animate) {
  if (animate === this._animate) {
    return;
  }
  this._animate = animate;

  if (this._state !== YLabelContentView.STATE_SHOWING_CONTENT) {
    this._splashScreen.setAnimate(animate);
  }
  if (this._chunkView !== null) {
    this._chunkView.setAnimate(animate);
  }

  if (animate) {
    window.crystal.addListener(this._crystalCallback);
  } else {
    window.crystal.removeListener(this._crystalCallback);
  }
};

YLabelContentView.prototype.draw = function(viewportX, viewportWidth, height, barShowingHeight) {
  if (this._state !== YLabelContentView.STATE_SHOWING_CONTENT) {
    this._splashScreen.layout(viewportWidth, height);
  } else {
    // TODO: this.
  }
};

YLabelContentView.prototype._setState = function(state) {
  if (state === this._state) {
    return;
  }

  if (state === YLabelContentView.STATE_SHOWING_CONTENT) {
    this._splashScreen.setAnimate(false);
    this._element.innerHTML = '';
    this._addContentElements();
  } else if (!this._splashScreen.element().parentNode) {
    this._splashScreen.setAnimate(this._animate);
    this._element.innerHTML = '';
    this._element.appendChild(this._splashScreen.element());
  }

  this._state = state;

  switch (state) {
  case YLabelContentView.STATE_LOADING:
    this._splashScreen.start();
    break;
  case YLabelContentView.STATE_FAILED:
    this._splashScreen.showError();
    break;
  case YLabelContentView.STATE_SHOWING_CONTENT:
    this._drawCanvas();
    break;
  }
};

YLabelContentView.prototype._addContentElements = function() {
  this._element.appendChild(this._canvas);
};

YLabelContentView.prototype._drawCanvas = function() {
  // TODO: this.
};

YLabelContentView.prototype._pixelRatioChanged = function() {
  // TODO: redraw the canvas here.
  this._drawCanvas();
};

function PositiveState(attrs) {
  this.leftmostChunk = attrs.leftmostChunk || null;
  this.visibleChunk = attrs.visibleChunk || null;
  this.chunkView = attrs.chunkView || null;
  this.dataSourceLength = attrs.dataSourceLength || 0;

  this.animating = attrs.animating || false;
  this.startYLabels = attrs.startYLabels || null;
  this.endYLabels = attrs.endYLabels || null;

  this.yLabels = attrs.yLabels || null;
  this.leftmostYLabels = attrs.leftmostYLabels || null;
  this.leftmostYLabelsPointCount = attrs.leftmostYLabelsPointCount || 0;

  this.scrollOffset = attrs.scrollOffset || 0;
  this.contentWidth = attrs.contentWidth || 0;
  this.viewportWidth = attrs.viewportWidth || 0;
}

// showingSplashScreen returns true if there is not enough loaded information to display anything
// besides a splash screen.
PositiveState.prototype.showingSplashScreen = function() {
  return this.chunkView === null || this.leftmostYLabels === null;
};

// leftBufferSpace returns the number of pixels that the user would have to scroll to the left
// before seeing the leftmost edge of the current ChunkView. If this is negative, then the ChunkView
// cannot fully take up the current viewport (although y-axis labels may cover the gap).
//
// If the state does not contain a ChunkView, this returns -1.
PositiveState.prototype.leftBufferSpace = function() {
  if (this.chunkView === null) {
    return -1;
  }
  return this.scrollOffset - (this.leftmostYLabels.width + this.chunkView.getLeftOffset());
};

// rightBufferSpace is like leftBufferSpace, but it is an equivalent measure for scrolling right to
// see the rightmost part of the ChunkView.
PositiveState.prototype.rightBufferSpace = function() {
  if (this.chunkView === null) {
    return -1;
  }
  var rightX = this.leftmostYLabels.width + this.chunkView.getLeftOffset() +
    this.chunkView.getInherentWidth();
  var scrolledRightX = rightX - this.scrollOffset;
  return scrolledRightX - this.viewportWidth;
};

// hasCompleteChunk returns true if the current chunk contains all the data in the data source.
PositiveState.prototype.hasCompleteChunk = function() {
  if (this.visibleChunk === null) {
    return false;
  }
  return this.visibleChunk.getLength() === this.dataSourceLength;
};

function NormativeState(attrs) {
  this.needsLeftmostChunk = attrs.needsLeftmostChunk || false;
  this.loadingLeftmostChunk = attrs.loadingLeftmostChunk || false;
  this.leftmostChunkLength = attrs.leftmostChunkLength || 0;

  this.needsVisibleChunk = attrs.needsVisibleChunk || false;
  this.loadingVisibleChunk = attrs.loadingVisibleChunk || false;
  this.visibleChunkStart = attrs.visibleChunkStart || 0;
  this.visibleChunkLength = attrs.visibleChunkLength || 0;
}

exports.YLabelContentView = YLabelContentView;
