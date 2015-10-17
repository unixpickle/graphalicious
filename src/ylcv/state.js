// StateViewState stores a State and some additional information used for a StateView specifically.
// These states are used internally by a StateView.
function StateViewState(positive, normative, attrs) {
  this.positive = positive;
  this.normative = normative;

  this.yLabels = attrs.yLabels || null;
  this.yLabelsStartIndex = attrs.yLabelsStartIndex || -1;
  this.yLabelsLength = attrs.yLabelsEndIndex || -1;

  this.chunkView = attrs.chunkView || null;

  this.showingContent = attrs.showingContent || false;
  this.animate = attrs.animate || false;

  this.animating = attrs.animating || false;
  this.animationProgress = attrs.animationProgress || 0;
  this.startLeftmostLabelWidth = attrs.startLeftmostLabelWidth || 0;
  this.startYLabels = attrs.startYLabels || null;

  this.liveLeftmostLabelWidth = attrs.liveLeftmostLabelWidth || 0;
  this.liveContentWidth = attrs.liveContentWidth || 0;
}

// copy generates a quasi-deep copy of this state.
// The yLabels, chunkView, startYLabels and endYLabels are not copied, but everything else is copied
// deeply.
StateViewState.prototype.copy = function() {
  return new StateViewState(new PositiveState(this.positive), new NormativeState(this.normative),
    this);
};

// State stores both a PositiveState and NormativeState.
function State(positive, normative) {
  this.positive = positive;
  this.normative = normative;
}

// copy generates a deep copy of the state.
State.prototype.copy = function() {
  return new State(new PositiveState(this.positive), new NormativeState(this.normative));
};

// PositiveState stores information about the current visual state of a ContentView.
function PositiveState(attrs) {
  this.visibleChunkStart = attrs.visibleChunkStart || -1;
  this.visibleChunkLength = attrs.visibleChunkLength || -1;
  this.chunkViewLeftOffset = attrs.chunkViewLeftOffset || -1;
  this.chunkViewInherentWidth = attrs.chunkViewInherentWidth || -1;

  this.dataSourceLength = attrs.dataSourceLength || 0;
  this.leftmostChunkLength = attrs.leftmostChunkLength || -1;
  this.leftmostYLabelsWidth = attrs.leftmostYLabelsWidth || -1;
  this.leftmostYLabelsPointCount = attrs.leftmostYLabelsPointCount || -1;

  this.viewportX = attrs.viewportX || 0;
  this.contentWidth = attrs.contentWidth || 0;
  this.viewportWidth = attrs.viewportWidth || 0;
  this.viewportHeight = attrs.viewportHeight || 0;
  this.barShowingHeight = attrs.barShowingHeight || 0;
}

// NormativeState stores information about what will or ought to change about the current visual
// state of a content view.
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

// recompute uses a ViewProvider and a PositiveState to update this normative state's fields based
// on what data should be loaded.
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
    left: positiveState.viewportX - positiveState.leftmostYLabels -
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
    left: positiveState.viewportX - positiveState.leftmostYLabelsWidth -
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
