//deps event_emitter.js

// YLabelContentView draws a ViewProvider with y-axis labels.
function YLabelContentView(provider, dataSource, splashScreen) {
  EventEmitter.call(this);

  this._element = document.createElement('div');
  this._element.position = 'absolute';
  this._splashScreen = splashScreen;
  this._canvas = document.createElement('canvas');
  this._element.appendChild(splashScreen.element());
  splashScreen.setAnimate(false);

  this._provider = provider;
  this._dataSource = dataSource;

  this._chunkView = null;
  this._yLabels = null;
  this._keepRightOnNextChange = false;

  this._animating = false;
  this._startYLabels = null;
  this._endYLabels = null;

  this._positiveState = new PositiveState({});
  this._normativeState = new NormativeState({});

  this._animate = false;
  this._crystalCallback = this._pixelRatioChanged.bind(this);
}

YLabelContentView.prototype = Object.create(EventEmitter.prototype);

YLabelContentView.prototype.element = function() {
  return this._element;
};

YLabelContentView.prototype.totalWidth = function() {
  if (this._showingContent()) {
    return this._chunkView.getInherentWidth() + this._chunkView.getRightOffset() +
      this._chunkView.getLeftOffset();
  } else {
    return 0;
  }
};

YLabelContentView.prototype.setAnimate = function(animate) {
  if (animate === this._animate) {
    return;
  }
  this._animate = animate;

  if (animate) {
    window.crystal.addListener(this._crystalCallback);
  } else {
    window.crystal.removeListener(this._crystalCallback);
  }

  if (this._showingContent()) {
    this._chunkView.setAnimate(animate);
  } else {
    this._splashScreen.setAnimate(animate);
  }
};

YLabelContentView.prototype.draw = function(viewportX, viewportWidth, height, barShowingHeight) {
  // TODO: update the positive state here and then update the normative state based on it.
  // TODO: update the size of the canvas if necessary.
  this._lastHeight = height;

  if (!this._showingContent()) {
    this._splashScreen.layout(viewportWidth, height);
  } else {
    this._drawCanvas();
    // TODO: position the inline loaders if necessary.
  }
};

YLabelContentView.prototype._addContentElements = function() {
  this._element.appendChild(this._canvas);
};

YLabelContentView.prototype._drawCanvas = function() {
  // TODO: this.
};

YLabelContentView.prototype._pixelRatioChanged = function() {
  // TODO: update the size of the canvas here.
  this._drawCanvas();
};

YLabelContentView.prototype._showingContent = function() {
  return this._chunkView !== null && !this._normativeState.needsLeftmostChunk;
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
  var minWidth = positiveState.viewportWidth + NormativeState.LEFTMOST_MIN_BUFFER;
  var minLength = provider.computeTheoreticalChunk({width: minWidth, left: 0},
    positiveState.dataSourceLength).length;

  if (positiveState.leftmostChunkLength >= minLength) {
    this.needsLeftmostChunk = false;
    this.loadingLeftmostChunk = false;
  } else if (!this.needsLeftmostChunk || this.leftmostChunkLength < minLength) {
    this.loadingLeftmostChunk = true;
    this.needsLeftmostChunk = true;

    var theoreticalChunk = {
      left: 0,
      width: positiveState.viewportWidth + NormativeState.LEFTMOST_START_BUFFER
    };
    this.leftmostChunkLength = provider.computeTheoreticalChunk(theoreticalChunk,
      positiveState.dataSourceLength).length;
  }
};

NormativeState.prototype._recomputeVisible = function(provider, positiveState) {
  var minRegion = {
    left: positiveState.scrollOffset - positiveState.leftmostYLabels -
      NormativeState.VISIBLE_MIN_BUFFER,
    width: NormativeState.VISIBLE_MIN_BUFFER*2 + positiveState.viewportWidth
  };
  var minChunk = provider.computeTheoreticalChunk(minRegion);

  var visibleChunkEnd = positiveState.visibleChunkStart + positiveState.visibleChunkLength;
  if (positiveState.visibleChunkStart <= minChunk.start &&
      visibleChunkEnd >= minChunk.start+minChunk.length) {
    this.needsVisibleChunk = false;
    this.loadingVisibleChunk = false;
    return;
  }

  if (this.needsVisibleChunk) {
    var gettingChunkEnd = this.visibleChunkStart + this.visibleChunkLength;
    if (this.visibleChunkStart <= minChunk.start &&
        gettingChunkEnd >= minChunk.start+minChunk.length) {
      return;
    }
  }

  var needRegion = {
    left: positiveState.scrollOffset - positiveState.leftmostYLabelsWidth -
      NormativeState.VISIBLE_START_BUFFER,
    width: NormativeState.VISIBLE_START_BUFFER*2 + positiveState.viewportWidth
  };

  // NOTE: we do this to ensure that we use up as much buffer space as possible even if the user is
  // scrolled all the way to the left or to the right.
  if (needRegion.left+needRegion.width > positiveState.contentWidth) {
    needRegion.left -= needRegion.left + needRegion.width - positiveState.contentWidth;
  } else if (needRegion.left < 0) {
    needRegion.left = 0;
  }

  var needChunk = provider.computeTheoreticalChunk(needRegion, positiveState.dataSourceLength);

  this.needsVisibleChunk = true;
  this.loadingVisibleChunk = true;
  this.visibleChunkStart = needChunk.startIndex;
  this.visibleChunkLength = needChunk.length;
};

exports.YLabelContentView = YLabelContentView;
