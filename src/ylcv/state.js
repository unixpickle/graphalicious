// ViewState stores a State and some additional information used for a StateView specifically.
// These states are used internally by a StateView.
function ViewState(positive, normative, attrs) {
  this.positive = new PositiveState(positive);
  this.normative = new NormativeState(normative);

  this.viewFrozen = defaultValue(attrs.viewFrozen, false);

  this.yLabels = defaultValue(attrs.yLabels, null);

  this.chunkView = defaultValue(attrs.chunkView, null);
  this.chunkViewStartIndex = defaultValue(attrs.chunkViewStartIndex, -1);
  this.chunkViewLength = defaultValue(attrs.chunkViewLength, -1);

  this.showingContent = defaultValue(attrs.showingContent, false);
  this.animate = defaultValue(attrs.animate, false);

  this.animating = defaultValue(attrs.animating, false);
  this.animationChunkView = defaultValue(attrs.animationChunkView, null);
  this.animationProgress = defaultValue(attrs.animationProgress, -1);
  this.startLeftmostLabelWidth = defaultValue(attrs.startLeftmostLabelWidth, -1);
  this.startYLabels = defaultValue(attrs.startYLabels, null);

  this.liveLeftmostLabelWidth = defaultValue(attrs.liveLeftmostLabelWidth, -1);
  this.liveContentWidth = defaultValue(attrs.liveContentWidth, -1);
}

// copy generates a quasi-deep copy of this state.
// Every y-label and ChunkView is shallow copied, but everything else is deeply copied.
ViewState.prototype.copy = function() {
  return new ViewState(this.positive, this.normative, this);
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
  this.dataSourceLength = defaultValue(attrs.dataSourceLength, 0);

  this.visibleChunkStart = defaultValue(attrs.visibleChunkStart, -1);
  this.visibleChunkLength = defaultValue(attrs.visibleChunkLength, -1);

  this.leftmostChunkLength = defaultValue(attrs.leftmostChunkLength, -1);
  this.leftmostYLabelsWidth = defaultValue(attrs.leftmostYLabelsWidth, -1);
  this.leftmostYLabelsPointCount = defaultValue(attrs.leftmostYLabelsPointCount, -1);

  this.contentWidth = defaultValue(attrs.contentWidth, 0);
  this.viewportX = defaultValue(attrs.viewportX, 0);
  this.viewportWidth = defaultValue(attrs.viewportWidth, 0);
  this.viewportHeight = defaultValue(attrs.viewportHeight, 0);
  this.barShowingHeight = defaultValue(attrs.barShowingHeight, 0);
  this.requestedViewportX = defaultValue(attrs.requestedViewportX, -1);
}

// NormativeState stores information about what will or ought to change about the current visual
// state of a content view.
function NormativeState(attrs) {
  this.needsLeftmostChunk = defaultValue(attrs.needsLeftmostChunk, false);
  this.loadingLeftmostChunk = defaultValue(attrs.loadingLeftmostChunk, false);
  this.leftmostChunkLength = defaultValue(attrs.leftmostChunkLength, 0);

  this.needsVisibleChunk = defaultValue(attrs.needsVisibleChunk, false);
  this.loadingVisibleChunk = defaultValue(attrs.loadingVisibleChunk, false);
  this.visibleChunkStart = defaultValue(attrs.visibleChunkStart, 0);
  this.visibleChunkLength = defaultValue(attrs.visibleChunkLength, 0);
}

NormativeState.LEFTMOST_START_BUFFER = 2000;
NormativeState.LEFTMOST_MIN_BUFFER = 0;
NormativeState.VISIBLE_START_BUFFER = 2000;
NormativeState.VISIBLE_MIN_BUFFER = 1000;
NormativeState.SMALL_GAP_WIDTH = 100;

NormativeState._removeSmallEdgeGaps = function(region, positiveState) {
  if (region.left > 0 && region.left < NormativeState.SMALL_GAP_WIDTH) {
    region.width += region.left;
    region.left = 0;
  }
  var rightGap = positiveState.contentWidth - (region.left + region.width);
  if (rightGap > 0 && rightGap < NormativeState.SMALL_GAP_WIDTH) {
    region.width += rightGap;
  }
};

// recompute uses a ViewProvider and a PositiveState to update this normative state's fields based
// on what data should be loaded.
NormativeState.prototype.recompute = function(style, positiveState) {
  this._recomputeLeftmost(style, positiveState);
  this._recomputeVisible(style, positiveState);
};

NormativeState.prototype._recomputeLeftmost = function(style, positiveState) {
  var minWidth = positiveState.viewportWidth + NormativeState.LEFTMOST_MIN_BUFFER;
  var minLength = style.computeRange({width: minWidth, left: 0},
    positiveState.dataSourceLength).length;

  if (positiveState.leftmostChunkLength >= minLength) {
    this.needsLeftmostChunk = false;
    this.loadingLeftmostChunk = false;
  } else if (!this.needsLeftmostChunk || this.leftmostChunkLength < minLength) {
    if (!this.needsLeftmostChunk) {
      this.loadingLeftmostChunk = true;
      this.needsLeftmostChunk = true;
    }

    var theoreticalChunk = {
      left: 0,
      width: positiveState.viewportWidth + NormativeState.LEFTMOST_START_BUFFER
    };

    NormativeState._removeSmallEdgeGaps(theoreticalChunk, positiveState);
    this.leftmostChunkLength = style.computeRange(theoreticalChunk,
      positiveState.dataSourceLength).length;
  }
};

NormativeState.prototype._recomputeVisible = function(style, positiveState) {
  var upperBound = positiveState.contentWidth + positiveState.leftmostYLabelsWidth -
    positiveState.viewportWidth;
  var viewportX = Math.max(0, upperBound);
  if (positiveState.requestedViewportX >= 0) {
    viewportX = Math.max(0, Math.min(upperBound, positiveState.requestedViewportX));
  }

  var minRegion = {
    left: viewportX - positiveState.leftmostYLabelsWidth - NormativeState.VISIBLE_MIN_BUFFER,
    width: NormativeState.VISIBLE_MIN_BUFFER*2 + positiveState.viewportWidth
  };
  var minChunk = style.computeRange(minRegion, positiveState.dataSourceLength);

  var visibleChunkEnd = positiveState.visibleChunkStart + positiveState.visibleChunkLength;
  if (positiveState.visibleChunkStart <= minChunk.startIndex &&
      visibleChunkEnd >= minChunk.startIndex+minChunk.length) {
    this.needsVisibleChunk = false;
    this.loadingVisibleChunk = false;
    return;
  }

  if (this.needsVisibleChunk) {
    var gettingChunkEnd = this.visibleChunkStart + this.visibleChunkLength;
    if (this.visibleChunkStart <= minChunk.startIndex &&
        gettingChunkEnd >= minChunk.startIndex+minChunk.length) {
      return;
    }
  }

  var needRegion = {
    left: viewportX - positiveState.leftmostYLabelsWidth - NormativeState.VISIBLE_START_BUFFER,
    width: NormativeState.VISIBLE_START_BUFFER*2 + positiveState.viewportWidth
  };

  // NOTE: we do this to ensure that we use up as much buffer space as possible even if the user is
  // scrolled all the way to the left or to the right.
  if (needRegion.left+needRegion.width > positiveState.contentWidth) {
    needRegion.left -= needRegion.left + needRegion.width - positiveState.contentWidth;
  } else if (needRegion.left < 0) {
    needRegion.left = 0;
  }

  NormativeState._removeSmallEdgeGaps(needRegion, positiveState);
  var needChunk = style.computeRange(needRegion, positiveState.dataSourceLength);

  if (!this.needsVisibleChunk) {
    this.needsVisibleChunk = true;
    this.loadingVisibleChunk = true;
  }
  this.visibleChunkStart = needChunk.startIndex;
  this.visibleChunkLength = needChunk.length;
};

function defaultValue(value, d) {
  return ('undefined' === typeof value ? d : value);
}
