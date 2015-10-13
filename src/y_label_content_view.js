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

// The PositiveState stores information about the current visual state of a YLabelContentView.
function PositiveState(attrs) {
  this.visibleChunkStart = attrs.visibleChunkStart || -1;
  this.visibleChunkLength = attrs.visibleChunkLength || -1;
  this.chunkViewLeftOffset = attrs.chunkViewLeftOffset || -1;
  this.chunkViewInherentWidth = attrs.chunkViewInherentWidth || -1;

  this.dataSourceLength = attrs.dataSourceLength || 0;

  this.leftmostChunkLength = attrs.leftmostChunkLength || -1;
  this.leftmostYLabelsWidth = attrs.leftmostYLabelsWidth || -1;
  this.leftmostYLabelsPointCount = attrs.leftmostYLabelsPointCount || -1;

  this.scrollOffset = attrs.scrollOffset || 0;
  this.contentWidth = attrs.contentWidth || 0;
  this.viewportWidth = attrs.viewportWidth || 0;
}

// leftBufferSpace returns the number of pixels that the user would have to scroll to the left
// before seeing the leftmost edge of the current ChunkView. If this is negative, then the ChunkView
// cannot fully take up the current viewport (although y-axis labels may cover the gap).
//
// If the left buffer space is fully taken up (i.e. the chunk view starts completely at the left),
// this returns Infinity.
//
// If the state does not contain a ChunkView, this returns -1.
PositiveState.prototype.leftBufferSpace = function() {
  if (this.chunkViewLeftOffset < 0) {
    return -1;
  } else if (this.visibleChunkStart === 0) {
    return Infinity;
  }
  return this.scrollOffset - (this.leftmostYLabelsWidth + this.chunkViewLeftOffset);
};

// rightBufferSpace is like leftBufferSpace, but it is an equivalent measure for scrolling right to
// see the rightmost part of the ChunkView.
PositiveState.prototype.rightBufferSpace = function() {
  if (this.chunkViewLeftOffset < 0) {
    return -1;
  } else if (this.visibleChunkStart + this.visibleChunkLength === this.dataSourceLength) {
    return Infinity;
  }
  var rightX = this.leftmostYLabelsWidth + this.chunkViewLeftOffset +
    this.chunkViewInherentWidth;
  var scrolledRightX = rightX - this.scrollOffset;
  return scrolledRightX - this.viewportWidth;
};

// hasCompleteLeftmostChunk returns true if the leftmost chunk is complete.
PositiveState.prototype.hasCompleteLeftmostChunk = function() {
  if (this.leftmostChunk === null) {
    return false;
  }
  return this.leftmostChunkLength === this.dataSourceLength;
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

NormativeState.LEFTMOST_START_BUFFER = 1000;
NormativeState.LEFTMOST_MIN_BUFFER = 0;
NormativeState.VISIBLE_START_BUFFER = 2000;
NormativeState.VISIBLE_MIN_BUFFER = 1000;

NormativeState.prototype.recompute = function(provider, positiveState) {
  var newState = new NormativeState(this);
  newState._recomputeLeftmost(provider, positiveState);
  newState._recomputeVisible(provider, positiveState);
};

NormativeState.prototype._recomputeLeftmost = function(provider, positiveState) {
  if (positiveState.hasCompleteLeftmostChunk()) {
    this.needsLeftmostChunk = false;
    this.loadingLeftmostChunk = false;
    return;
  }

  var startWidth = Math.min(positiveState.viewportWidth+NormativeState.LEFTMOST_START_BUFFER,
    positiveState.contentWidth);
  var minWidth = Math.min(positiveState.viewportWidth+NormativeState.LEFTMOST_MIN_BUFFER,
    positiveState.contentWidth);

  var existingChunkLength = (this.needsLeftmostChunk ? this.leftmostChunkLength :
    positiveState.leftmostChunkLength);
  var minChunkLength = Math.min(provider.pointCountForWidth(minWidth),
    positiveState.dataSourceLength);
  if (existingChunkLength < minChunkLength) {
    this.needsLeftmostChunk = true;
    this.leftmostChunkLength = Math.min(provider.pointCountForWidth(startWidth),
      positiveState.dataSourceLength);
    this.loadingLeftmostChunk = true;
  } else {
    this.needsLeftmostChunk = false;
  }
};

NormativeState.prototype._recomputeVisible = function(provider, positiveState) {
  if (positiveState.leftBufferSpace() >= NormativeState.VISIBLE_MIN_BUFFER &&
      positiveState.rightBufferSpace() >= NormativeState.VISIBLE_MIN_BUFFER) {
    this.needsVisibleChunk = false;
    this.loadingVisibleChunk = false;
    return;
  }

  // TODO: if we are loading something already, check if it already meets the visible min buffer
  // requirements before attempting to fetch anything further.

  var startX = Math.max(Math.min(positiveState.scrollOffset - positiveState.leftmostYLabelsWidth -
    NormativeState.VISIBLE_START_BUFFER, positiveState.contentWidth), 0);
  var startIndex = Math.min(Math.floor(provider.indexForX(startX)),
    positiveState.dataSourceLength-1);

  var width = NormativeState.VISIBLE_START_BUFFER*2 + positiveState.viewportWidth;
  var pointCount = Math.max(Math.min(provider.pointCountForWidth(width),
    positiveState.dataSourceLength-startIndex), 0);

  this.needsVisibleChunk = true;
  this.loadingVisibleChunk = true;
  this.visibleChunkStart = startIndex;
  this.visibleChunkLength = pointCount;
};

exports.YLabelContentView = YLabelContentView;
