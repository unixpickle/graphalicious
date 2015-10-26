//deps includes.js

// SPLASH_SCREEN_DELAY is the number of milliseconds before the SplashScreen should be shown after
// it is warranted. This ensures that quick loading animations do not trigger a SplashScreen.
var SPLASH_SCREEN_DELAY = 50;

// MIN_SPLASH_SCREEN_TIME is the minimum number of milliseconds for which the SplashScreen should be
// shown consecutively. This prevents "flickers" of the SplashScreen.
var MIN_SPLASH_SCREEN_TIME = 300;

var DEFAULT_KEEP_RIGHT = true;

var JAGGED_EDGE_SIZE = 5;
var JAGGED_LINE_WIDTH = 2;
var JAGGED_COLOR = '#d5d5d5';
var LINE_COLOR = '#d5d5d5';

// StateView is responsible for drawing a state and rendering animations.
// The StateView is not responsible for updating the state, just for handling state changes.
function StateView(state, attrs) {
  EventEmitter.call(this);

  this._state = new ViewState(state.positive, state.normative, {});

  this._loader1 = attrs.loader1;
  this._loader2 = attrs.loader2;
  this._splashScreen = attrs.splashScreen;
  this._dataSource = attrs.dataSource;
  this._provider = attrs.provider;
  this._labelGenerator = attrs.labelGenerator;
  this._topMargin = attrs.topMargin;
  this._bottomMargin = attrs.bottomMargin;

  this._element = document.createElement('div');
  this._element.style.position = 'absolute';
  this._canvas = document.createElement('canvas');
  this._context = this._canvas.getContext('2d');
  this._element.appendChild(this._splashScreen.element());
  this._splashScreen.setAnimate(false);

  this._splashScreen.showLoading();
  this._loader1.showLoading();
  this._loader2.showLoading();

  this._pixelRatio = 0;
  this._crystalCallback = this._updatePixelRatio.bind(this);

  this._keepRightOnWidthChange = DEFAULT_KEEP_RIGHT;

  // this._splashScreenDelay will be set to a timeout ID if the SplashScreen should be displayed
  // after a very short interval.
  // This makes it so that fast load operations do not "flicker" by showing the SplashScreen.
  this._splashScreenDelay = null;

  // this._doneLoadingTimeout will be set to a timeout ID if the SplashScreen was just displayed.
  // This makes sure that the SplashScreen never shows for a short enough amount of time that it
  // appears to flicker.
  this._doneLoadingTimeout = null;
}

StateView.prototype = Object.create(EventEmitter.prototype);

// element returns the element for the view.
StateView.prototype.element = function() {
  return this._element;
};

// totalWidth gets the width of the StateView based on the current state.
// This will also account for the current animation.
StateView.prototype.totalWidth = function() {
  if (this._state.showingContent) {
    return this._state.liveContentWidth + this._state.liveLeftmostLabelWidth;
  } else {
    return 0;
  }
};

// setAnimate enables/disables animations on the StateView.
StateView.prototype.setAnimate = function(flag) {
  var oldState = this._state.copy();
  this._state.animate = flag;
  this._handleStateChange(oldState);
};

// dispose removes any of the StateView's references to external objects like the ViewProvider.
StateView.prototype.dispose = function() {
  this.setAnimate(false);
};

// shouldUpdateRequestViewportX returns true if the content is currently showing.
// This is made to be used by the ContentView, which uses it to know whether to record the viewportX
// as the requestedViewportX.
StateView.prototype.shouldUpdateRequestedViewportX = function() {
  return this._state.showingContent;
};

// updateState indicates that the state changed for some reason other than a deletion, addition, or
// modification of a data point or from invalidation of the data set.
StateView.prototype.updateState = function(newState) {
  this._updateState(new ViewState(newState.positive, newState.normative, this._state));
};

// updateStateVisualStyleChange indicates that the visual style changed in some way.
// This is just like updateState, except it is guaranteed to re-generate the current ChunkView.
StateView.prototype.updateStateVisualStyleChange = function(newState) {
  var state = new ViewState(newState.positive, newState.normative, this._state);
  state.chunkView = null;
  this._updateState(state);
};

// updateStateDeletion indicates that the state changed specifically due to a deletion.
StateView.prototype.updateStateDelete = function(newState, oldIndex) {
  var state = new ViewState(newState.positive, newState.normative, this._state);

  if (state.animating) {
    state.animating = false;
    state.animationChunkView.finishAnimation();
  }

  var inVisibleChunk = state.positive.visibleChunkLength < this._state.positive.visibleChunkLength;
  var beforeVisibleChunk = state.positive.visibleChunkIndex <
    this._state.positive.visibleChunkIndex;

  if (inVisibleChunk) {
    this._keepRightOnWidthChange = (oldIndex < middleVisiblePointIndex(state));
    state.animating = state.chunkView.deletionInside(oldIndex);
    --state.chunkViewLength;
  } else if (beforeVisibleChunk) {
    this._keepRightOnWidthChange = true;
    state.chunkView.deletionBefore(oldIndex);
    --state.chunkViewStartIndex;
  } else {
    this._keepRightOnWidthChange = false;
    state.chunkView.deletionAfter(oldIndex);
  }

  assert(state.positive.visibleChunkIndex === state.chunkViewStartIndex);
  assert(state.positive.visibleChunkLength === state.chunkViewLength);

  this._updateState(state);
};

// updateStateInsert indicates that the state changed specifically due to an insertion.
StateView.prototype.updateStateInsert = function(newState, index) {
  var state = new ViewState(newState.positive, newState.normative, this._state);

  if (state.animating) {
    state.animating = false;
    state.animationChunkView.finishAnimation();
  }

  var inVisibleChunk = state.positive.visibleChunkLength > this._state.positive.visibleChunkLength;
  var beforeVisibleChunk = state.positive.visibleChunkIndex >
    this._state.positive.visibleChunkIndex;

  if (inVisibleChunk) {
    this._keepRightOnWidthChange = (index < middleVisiblePointIndex(state));
    state.animating = state.chunkView.insertionInside(index);
    ++state.chunkViewLength;
  } else if (beforeVisibleChunk) {
    this._keepRightOnWidthChange = true;
    state.chunkView.insertionBefore();
    --state.chunkViewStartIndex;
  } else {
    this._keepRightOnWidthChange = false;
    state.chunkView.insertionAfter();
  }

  assert(state.positive.visibleChunkIndex === state.chunkViewStartIndex);
  assert(state.positive.visibleChunkLength === state.chunkViewLength);

  this._updateState(state);
};

// updateStateModify indicates that the state changed specifically due to a modification.
StateView.prototype.updateStateModify = function(newState, index) {
  var state = new ViewState(newState.positive, newState.normative, this._state);

  if (state.animating) {
    state.animating = false;
    state.animationChunkView.finishAnimation();
  }

  if (index >= state.chunkViewStartIndex && index < state.chunkViewStartIndex+chunkViewLength) {
    state.animating = state.chunkView.modifyInside(index);
  }

  this._updateState(state);
};

// updateStateInvalidate indicates that the state changed specifically due to a data invalidation.
StateView.prototype.updateStateInvalidate = function(newState) {
  var state = new ViewState(newState.positive, newState.normative, this._state);
  assert(state.positive.visibleChunkIndex < 0 && state.positive.leftmostChunkLength < 0);
  this._updateState(state);
};

StateView.prototype._updateState = function(newViewState) {
  var oldState = this._state;
  this._state = newViewState;

  this._updateStateAnimation(oldState);
  this._updateStateChunkView();
  this._updateStateLiveMeasurements();
  this._updateStateShowingContent(oldState);
  this._updateStateYLabels();

  this._handleStateChange(oldState);
};

StateView.prototype._updateStateAnimation = function(oldState) {
  if (!this._state.animating) {
    if (oldState.animating) {
      this._animationChunkView.finishAnimation();
    }
    return;
  }

  if (!oldState.animating) {
    this._state.animationChunkView = this._state.chunkView;
    this._state.animationProgress = 0;
    this._state.startYLabels = oldState.yLabels;
    this._state.startLeftmostLabelWidth = oldState.positive.leftmostYLabelsWidth;
  }

  // TODO: detect scrolling to cancel the animation in that case as well.
  if (this._state.positive.visibleChunkStart < 0 ||
      !this._state.showingContent || !this._state.animate ||
      this._state.positive.viewportWidth !== oldState.positive.viewportWidth ||
      this._state.positive.barShowingHeight !== oldState.positive.barShowingHeight) {
    this._keepRightOnWidthChange = DEFAULT_KEEP_RIGHT;
    this._state.animationChunkView.finishAnimation();
    this._state.animating = false;
  }
};

StateView.prototype._updateStateChunkView = function() {
  var needsNewChunkView = false;
  if (this._state.chunkView !== null &&
      this._state.chunkViewStartIndex === this._state.positive.visibleChunkStart &&
      this._state.chunkViewLength === this._state.positive.visibleChunkLength) {
    return;
  }
  if (this._state.positive.visibleChunkStart < 0) {
    this._state.chunkView = null;
    this._state.chunkViewStartIndex = -1;
    this._state.chunkViewLength = -1;
  } else {
    var chunk = this._dataSource.getChunk(VISIBLE_CHUNK_INDEX);
    this._state.chunkView = this._provider.createChunkView(chunk, this._dataSource);
    this._state.chunkViewStartIndex = chunk.getStartIndex();
    this._state.chunkViewLength = chunk.getLength();
    this._registerChunkViewEvents();
  }
};

StateView.prototype._registerChunkViewEvents = function() {
  this._state.chunkView.on('redraw', this._drawCanvas.bind(this));
  this._state.chunkView.on('animationEnd', function() {
    var state = new ViewState(newState.positive, newState.normative, this._state);
    state.animating = false;
    this._updateState(state);
  }.bind(this));
  this._state.chunkView.on('animationFrame', function(progress) {
    var state = new ViewState(newState.positive, newState.normative, this._state);
    state.animationProgress = progress;
    this._updateState(state);
  }.bind(this));
};

StateView.prototype._updateStateLiveMeasurements = function() {
  if (!this._state.animating) {
    this._state.liveLeftmostLabelWidth = this._state.positive.leftmostYLabelsWidth;
    this._state.liveContentWidth = this._state.positive.contentWidth;
  } else {
    var left = (1-this._state.animationProgress)*this._state.startLeftmostLabelWidth +
      this._state.animationProgress*this._state.positive.leftmostYLabelsWidth;
    this._state.liveLeftmostLabelWidth = left;
    this._state.liveContentWidth = this._state.animationChunkView.getInherentWidth() +
      this._state.animationChunkView.getLeftOffset() +
      this._state.animationChunkView.getRightOffset();
  }
};

StateView.prototype._updateStateShowingContent = function(oldState) {
  if (this._doneLoadingTimeout !== null) {
    return;
  }

  var shouldHideContent = (this._state.chunkView === null ||
    this._state.normative.needsLeftmostChunk);
  var oldShouldHideContent = (oldState.chunkView === null || oldState.normative.needsLeftmostChunk)

  if (shouldHideContent && !oldShouldHideContent) {
    assert(this._splashScreenDelay === null);
    this._startSplashScreenDelay();
  } else if (!shouldHideContent && oldShouldHideContent) {
    if (this._splashScreenDelay !== null) {
      clearTimeout(this._splashScreenDelay);
      this._splashScreenDelay = null;
    }
    this._state.showingContent = true;
  }
};

StateView.prototype._updateStateYLabels = function() {
  if (this._state.chunkView === null) {
    return;
  }

  var chunk = this._dataSource.getChunk(VISIBLE_CHUNK_INDEX);
  assert(chunk !== null);

  // TODO: here, predict what the viewportX will be at the end of the animation using
  // this._keepRightOnWidthChange and the chunkView's animation info.
  var predictedViewportX = this._state.positive.viewportX;

  var startLeft = predictedViewportX - this._state.positive.leftmostYLabelsWidth;
  var subregionLeft = startLeft - this._state.chunkView.getPostAnimationLeftOffset();
  var endLeft = subregionLeft + this._state.positive.viewportWidth;

  var firstPoint = this._state.chunkView.postAnimationFirstVisibleDataPoint(subregionLeft);
  var lastPoint = this._state.chunkView.postAnimationLastVisibleDataPoint(endLeft);

  var maxValue = 0;
  for (var i = firstPoint; i <= lastPoint; ++i) {
    maxValue = Math.max(maxValue, chunk.getDataPoint(i).primary);
  }

  var usableHeight = this._state.positive.barShowingHeight - this._topMargin - this._bottomMargin;
  if (usableHeight < 0) {
    usableHeight = 0;
  }
  var newLabels = this._labelGenerator.createLabels(maxValue, usableHeight);
  if (this._state.yLabels === null || !newLabels.equals(this._state.yLabels)) {
    this._state.yLabels = newLabels;
  }
};

// _handleStateChange performs all the needed visual tasks due to a change in the ViewState.
StateView.prototype._handleStateChange = function(oldState) {
  var redraw = false;
  var widthChanged = false;

  if (oldState.animate !== this._state.animate) {
    this._handleAnimateChange();
  }

  if (this._state.animating !== oldState.animating ||
      (this._state.animating && this._state.animationProgress !== oldState.animationProgress)) {
    redraw = true;
  }

  if (oldState.showingContent !== this._state.showingContent) {
    this._handleShowingContentChange();
    widthChanged = true;
    redraw = true;
  }

  if (this._state.positive.viewportWidth !== oldState.positive.viewportWidth ||
      this._state.positive.viewportHeight !== oldState.positive.viewportHeight) {
    redraw = true;
    this._updateCanvasSize();
  }

  if (!this._state.viewFrozen) {
    this._handleNormativeChanges(oldState);
    if (this._state.positive.viewportX !== oldState.positive.viewportX ||
        oldState.chunkView !== this._state.chunkView ||
        oldState.yLabels !== this._state.yLabels) {
      redraw = true;
    }
    if (!widthChanged && this._state.showingContent) {
      var oldTotalWidth = oldState.liveLeftmostLabelWidth + oldState.liveContentWidth;
      var newTotalWidth = this._state.liveLeftmostLabelWidth + this._state.liveContentWidth;
      if (oldTotalWidth !== newTotalWidth) {
        widthChanged = true;
      }
    }
  } else if (oldState.viewFrozen) {
    // NOTE: the width might have changed while the view was frozen.
    // TODO: this could be "optimized" to check if the width *actually* changed, but it'd be
    // premature for now.
    widthChanged = true;

    this._handleNormativeChanges(oldState);
  }

  if (widthChanged) {
    if (this._state.showingContent && !oldState.showingContent &&
        this._state.positive.requestedViewportX >= 0) {
      this.emit('widthChange', this._state.positive.requestedViewportX);
    } else {
      var newViewportX = oldState.positive.viewportX;
      if (this._keepRightOnWidthChange) {
        var oldWidth = 0;
        if (oldState.showingContent) {
          oldWidth = oldState.liveContentWidth + oldState.liveLeftmostLabelWidth;
        }
        var newWidth = this.totalWidth();
        newViewportX += newWidth - oldWidth;
      }
      this.emit('widthChange', newViewportX);
    }
    // TODO: see if widthChange triggered a redraw. If it did, don't do it again here.
    this._draw();
  } else if (redraw) {
    this._draw();
  };
};

StateView.prototype._handleAnimateChange = function(contentChanged) {
  if (this._state.animate) {
    window.crystal.addListener(this._crystalCallback);

    // NOTE: this is not done synchronously because that could trigger a state change while handling
    // an existing state change.
    window.requestAnimationFrame(this._updatePixelRatio.bind(this));
  } else {
    window.crystal.removeListener(this._crystalCallback);
  }

  if (!this._state.animate) {
    this._loader1.setAnimate(false);
    this._loader2.setAnimate(false);
  }

  if (this._state.showingContent) {
    if (this._state.chunkView) {
      this._state.chunkView.setAnimate(this._state.animate);
    }
  } else {
    this._splashScreen.setAnimate(this._state.animate);
  }
};

StateView.prototype._handleShowingContentChange = function() {
  if (this._state.showingContent) {
    this._element.removeChild(this._splashScreen.element());
    this._splashScreen.setAnimate(false);

    this._element.appendChild(this._canvas);
    this._state.chunkView.setAnimate(this._state.animate);
  } else {
    this._element.removeChild(this._canvas);
    if (this._state.chunkView !== null) {
      this._state.chunkView.setAnimate(false);
    }
    this._element.appendChild(this._splashScreen.element());
    this._splashScreen.setAnimate(this._state.animate);
  }
};

StateView.prototype._handleNormativeChanges = function(oldState) {
  if (this._state.normative.loadingVisibleChunk !== oldState.normative.loadingVisibleChunk ||
      oldState.viewFrozen) {
    if (this._state.normative.loadingVisibleChunk) {
      this._loader1.showLoading();
      this._loader2.showLoading();
    } else {
      this._loader1.showError();
      this._loader2.showError();
    }
  }

  var newError = (this._state.normative.loadingVisibleChunk !==
    this._state.normative.needsVisibleChunk) || (this._state.normative.loadingLeftmostChunk !==
    this._state.normative.needsLeftmostChunk);
  var oldError = (oldState.normative.loadingVisibleChunk !==
    oldState.normative.needsVisibleChunk) || (oldState.normative.loadingLeftmostChunk !==
    oldState.normative.needsLeftmostChunk);
  if (newError !== oldError || oldState.viewFrozen) {
    if (newError) {
      this._splashScreen.showError();
    } else {
      this._splashScreen.showLoading();
    }
  }
};

// _draw instructs the StateView to draw itself given the current state.
// This will also accounts for the current animation.
StateView.prototype._draw = function() {
  // TODO: this might trigger a state change and redraw. Avoid doing a second redraw if possible.
  this._finishSplashScreenDelay();

  if (!this._state.showingContent) {
    this._splashScreen.layout(this._state.positive.viewportWidth,
      this._state.positive.viewportHeight);
    return;
  }

  this._drawCanvas();
  // TODO: position the inline loaders if necessary.
};

StateView.prototype._drawCanvas = function() {
  assert(this._state.chunkView !== null);
  assert(this._state.yLabels !== null);

  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

  var yLabelWidth;
  if (this._state.animating) {
    yLabelWidth = (1-this._state.animationProgress)*this._state.startYLabels.width() +
      this._state.animationProgress*this._state.yLabels.width();
  } else {
    yLabelWidth = this._state.yLabels.width();
  }

  var chunkRegionOrNull = this._drawChunkView(yLabelWidth);

  // TODO: draw the ziggity zaggity (edge of content).
  // TODO: draw the y-axis labels.

  this._drawYAxisLabels();
  if (chunkRegionOrNull !== null) {
    this._drawEdges(chunkRegionOrNull, yLabelWidth);
  }
};

StateView.prototype._drawChunkView = function(yLabelWidth) {
  var chunkView;
  var maxValue;
  if (this._state.animating) {
    maxValue = (1-this._state.animationProgress)*this._state.startYLabels.maxValue() +
      this._state.animationProgress*this._state.yLabels.maxValue();
    chunkView = this._state.animatingChunkView;
  } else {
    maxValue = this._state.yLabels.maxValue();
    chunkView = this._state.chunkView;
  }

  var height = this._state.positive.viewportHeight - (this._topMargin + this._bottomMargin);
  var y = this._topMargin;

  if (this._shouldStretchContent()) {
    var width = this._state.positive.viewportWidth - yLabelWidth;
    return chunkView.drawStretched(yLabelWidth, y, width, height, maxValue, this._context);
  } else {
    var chunkLeftInCanvas = chunkView.getLeftOffset() + this._state.liveLeftmostLabelWidth -
      this._state.positive.viewportX;
    var chunkEndInCanvas = chunkLeftInCanvas + this._state.chunkView.getInherentWidth();

    if (chunkLeftInCanvas > this._state.positive.viewportWidth || chunkEndInCanvas < yLabelWidth) {
      return null;
    }

    var regionLeft = Math.max(yLabelWidth, chunkLeftInCanvas) - chunkLeftInCanvas;
    var regionEnd = Math.min(this._state.positive.viewportWidth, chunkEndInCanvas) -
      chunkLeftInCanvas;
    var regionWidth = regionEnd - regionLeft;
    var canvasX = regionLeft + chunkLeftInCanvas;
    chunkView.draw(regionLeft, regionWidth, canvasX, y, height, maxValue, this._context);

    return {left: canvasX, width: regionWidth};
  }
};

StateView.prototype._drawYAxisLabels = function() {
  if (!this._state.animating) {
    this._state.yLabels.draw(this._context, 0, this._topMargin,
      this._state.positive.viewportHeight-this._bottomMargin);
    return;
  }
  var maxValue;
  maxValue = (1-this._state.animationProgress)*this._state.startYLabels.maxValue() +
    this._state.animationProgress*this._state.yLabels.maxValue();
  // TODO: draw animating labels here.
};

StateView.prototype._drawEdges = function(contentRect, yLabelsWidth) {
  for (var i = 0; i < 2; ++i) {
    var x = (i === 0 ? contentRect.left : contentRect.left+contentRect.width+JAGGED_EDGE_SIZE);
    if (x <= yLabelsWidth+2 || x >= this._state.positive.viewportWidth-2) {
      continue;
    }
    var startY = -(i === 0 ? 2 : 1)*JAGGED_EDGE_SIZE;

    this._context.beginPath();
    this._context.lineWidth = JAGGED_LINE_WIDTH;
    this._context.strokeStyle = JAGGED_COLOR;
    this._context.moveTo(x, 0);
    for (var y = startY; y < this._state.positive.viewportHeight; y += 2*JAGGED_EDGE_SIZE) {
      this._context.lineTo(x-JAGGED_EDGE_SIZE, y+JAGGED_EDGE_SIZE);
      this._context.lineTo(x, y+2*JAGGED_EDGE_SIZE);
    }
    this._context.stroke();
    this._context.closePath();
  }
};

StateView.prototype._shouldStretchContent = function() {
  return this._state.liveContentWidth + this._state.liveLeftmostLabelWidth <
    this._state.positive.viewportWidth;
};

StateView.prototype._updatePixelRatio = function() {
  var newRatio = Math.ceil(window.crystal.getRatio());
  if (this._pixelRatio === newRatio) {
    return;
  }
  this._pixelRatio = newRatio;
  this._updateCanvasSize();

  this._finishSplashScreenDelay();
  if (this._state.showingContent) {
    this._drawCanvas();
  }
};

StateView.prototype._updateCanvasSize = function() {
  this._canvas.width = this._state.positive.viewportWidth * this._pixelRatio;
  this._canvas.height = this._state.positive.viewportHeight * this._pixelRatio;
  this._canvas.style.width = this._state.positive.viewportWidth.toFixed(1) + 'px';
  this._canvas.style.height = this._state.positive.viewportHeight.toFixed(1) + 'px';
  this._context = this._canvas.getContext('2d');
  this._context.scale(this._pixelRatio, this._pixelRatio);
};

StateView.prototype._startSplashScreenDelay = function() {
  this._splashScreenDelay = setTimeout(this._finishSplashScreenDelay.bind(this),
    SPLASH_SCREEN_DELAY);
};

StateView.prototype._startLoadingTimeout = function() {
  if (this._splashScreenDelay !== null) {
    clearTimeout(this._splashScreenDelay);
    this._splashScreenDelay = null;
  }
  this._doneLoadingTimeout = setTimeout(function() {
    this._doneLoadingTimeout = null;
    if (this._state.chunkView !== null && !this._state.normative.needsLeftmostChunk) {
      var oldState = this._state.copy();
      this._state.showingContent = true;
      this._handleStateChange(oldState);
    }
  }.bind(this), MIN_SPLASH_SCREEN_TIME);
};

StateView.prototype._finishSplashScreenDelay = function() {
  if (this._splashScreenDelay === null) {
    return;
  }

  assert(this._state.chunkView === null || this._state.normative.needsLeftmostChunk);

  clearTimeout(this._splashScreenDelay);
  this._splashScreenDelay = null;

  this._startLoadingTimeout();
  var oldState = this._state.copy();
  this._state.showingContent = false;
  this._state.viewFrozen = false;
  this._handleStateChange(oldState);
};

// middleVisiblePointIndex takes a state and returns the index of the point closest to the middle of
// the viewport.
function middleVisiblePointIndex(state) {
  var middleLeft = (state.positive.viewportX - state.positive.leftmostYLabelsWidth) +
    state.positive.viewportWidth/2 - state.chunkView.getLeftOffset();
  return state.chunkView.firstVisibleDataPoint(middleLeft);
}
