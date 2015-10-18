//deps includes.js

// SPLASH_SCREEN_DELAY is the number of milliseconds before the SplashScreen should be shown after
// it is warranted. This ensures that quick loading animations do not trigger a SplashScreen.
var SPLASH_SCREEN_DELAY = 50;

// MIN_SPLASH_SCREEN_TIME is the minimum number of milliseconds for which the SplashScreen should be
// shown consecutively. This prevents "flickers" of the SplashScreen.
var MIN_SPLASH_SCREEN_TIME = 300;

var DEFAULT_KEEP_RIGHT = true;

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

  this._element = document.createElement('div');
  this._element.position = 'absolute';
  this._canvas = document.createElement('canvas');
  this._element.appendChild(this._splashScreen.element());
  this._splashScreen.setAnimate(false);

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

// draw instructs the StateView to draw itself given the current state.
// This will also account for the current animation.
StateView.prototype.draw = function() {
  if (!this._state.showingContent) {
    return;
  }

  this._drawCanvas();
  // TODO: position the inline loaders if necessary.
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
StateView.prototype.updateStateDelete = function(newState, oldIndex, inVisibleChunk) {
  var state = new ViewState(newState.positive, newState.normative, this._state);

  if (state.animating) {
    state.animating = false;
    state.animationChunkView.finishAnimation();
  }

  if (inVisibleChunk) {
    var middleLeft = (state.positive.viewportX - state.positive.leftmostYLabelsWidth) +
      state.positive.viewportWidth/2 - state.chunkView.getLeftOffset();
    var middleIndex = state.chunkView.firstVisibleDataPoint(middleLeft);
    this._keepRightOnWidthChange = (oldIndex < middleIndex);

    state.animating = state.chunkView.deletionInside(oldIndex);
    --state.chunkViewLength;
  } else if (oldIndex < state.chunkViewStartIndex) {
    this._keepRightOnWidthChange = true;
    --state.chunkViewStartIndex;
    state.chunkView.deletionBefore(oldIndex);
  } else {
    this._keepRightOnWidthChange = false;
    state.chunkView.deletionAfter(oldIndex);
  }

  this._updateState(state);
};

// updateStateAdd indicates that the state changed specifically due to an addition.
StateView.prototype.updateStateAdd = function(newState) {
  var state = new ViewState(newState.positive, newState.normative, this._state);

  if (state.animating) {
    state.animating = false;
    state.animationChunkView.finishAnimation();
  }

  if (newState.positive.visibleChunkLength > this._state.positive.visibleChunkLength) {
    var rightOffset = (state.positive.viewportX - state.positive.leftmostYLabelsWidth) +
      state.positive.viewportWidth - state.chunkView.getLeftOffset();
    var rightIndex = state.chunkView.lastVisibleDataPoint(rightOffset);
    this._keepRightOnWidthChange = (rightIndex === this._state.positive.visibleChunkLength-1);

    state.animating = state.chunkView.addInside();
    ++state.chunkViewLength;
  } else {
    this._keepRightOnWidthChange = false;
    state.chunkView.addAfter();
  }

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
  // TODO: this.
};

StateView.prototype._updateState = function(newViewState) {
  var oldState = this._state;
  this._state = newViewState;

  this._updateStateAnimation(oldState);
  this._updateStateChunkView();
  this._updateStateLiveMeasurements();
  // TODO: (re)generate the y-axis labels if necessary.
  // TODO: play with this._splashScreenDelay and this._doneLoadingTimeout if necessary.
  // TODO: compute the showingContent field of the new state.

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

  var cancel = false;

  if (this._state.positive.visibleChunkStart < 0 || !this._state.animate) {
    cancel = true;
  } else {
    cancel = (this._state.positive.viewportWidth !== oldState.positive.viewportWidth) ||
      (this._state.positive.barShowingHeight !== oldState.positive.barShowingHeight);
    // TODO: detect scrolling to cancel the animation in that case as well.
  }

  if (cancel) {
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
    this._state.chunkViewLength = chunk.getlength();
  }
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

// _handleStateChange performs all the needed visual tasks due to a change in the ViewState.
StateView.prototype._handleStateChange = function(oldState) {
  // TODO: handle normative state changes here.

  var redraw = false;
  var widthChanged = false;

  if (oldState.animate !== this._state.animate) {
    this._handleAnimateChange();
  }
  if (oldState.showingContent !== this._state.showingContent) {
    this._handleShowingContentChange();
    widthChanged = true;
    redraw = true;
  }
  if (oldState.chunkView !== this._state.chunkView) {
    redraw = true;
  }
  if (oldState.yLabels !== this._state.yLabels) {
    redraw = true;
  }
  if (!widthChanged && this._state.showingContent) {
    var oldTotalWidth = oldState.liveLeftmostLabelWidth + oldState.liveContentWidth;
    var newTotalWidth = this._state.liveLeftmostLabelWidth + this._state.liveContentWidth;
    if (oldTotalWidth !== newTotalWidth) {
      widthChanged = true;
    }
  }

  // TODO: check for animation changes here.
  // TODO: check for viewport changes here.

  if (widthChanged) {
    this.emit('widthChange', this._keepRightOnWidthChange);
  } else if (redraw) {
    this.draw();
  };
};

StateView.prototype._handleAnimateChange = function(contentChanged) {
  if (this._state.animate) {
    window.crystal.addListener(this._crystalCallback);
    this._updatePixelRatio();
  } else {
    window.crystal.removeListener(this._crystalCallback);
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

StateView.prototype._drawCanvas = function() {
  // TODO: draw the ChunkView (possibly stretched) and the ziggity zaggity (edge of content) here.
  // TODO: also draw the y-axis labels and the horizontal lines.
};

StateView.prototype._updatePixelRatio = function() {
  var newRatio = Math.ceil(window.crystal.getRatio());
  if (this._pixelRatio === newRatio) {
    return;
  }
  this._pixelRatio = newRatio;
  this._canvas.width = this._state.positive.viewportWidth * newRatio;
  this._canvas.height = this._state.positive.viewportHeight * newRatio;

  this._finishSplashScreenDelay();
  if (this._state.showingContent) {
    this._drawCanvas();
  }
};

StateView.prototype._startSplashScreenDelay = function() {
  this._splashScreenDelay = setTimeout(this._finishSplashScreenDelay.bind(this),
    SPLASH_SCREEN_DELAY);
};

StateView.prototype._finishSplashScreenDelay = function() {
  if (this._splashScreenDelay !== null) {
    clearTimeout(this._splashScreenDelay);
    this._splashScreenDelay = null;

    if (this._state.chunkView === null || this._state.normative.needsLeftmostChunk) {
      var oldState = this._state.copy();
      this._state.showingContent = false;
      this._handleStateChange(oldState);

      this._doneLoadingTimeout = setTimeout(function() {
        this._doneLoadingTimeout = null;
        if (this._state.chunkView !== null && !this._state.normative.needsLeftmostChunk) {
          var oldState = this._state.copy();
          this._state.showingContent = true;
          this._handleStateChange(oldState);
        }
      }.bind(this), MIN_SPLASH_SCREEN_TIME);
    }
  }
};
