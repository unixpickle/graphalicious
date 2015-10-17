//deps includes.js

// StateView is responsible for drawing a state and rendering animations.
// The StateView is not responsible for updating the state, just for handling state changes.
function StateView(state, attrs) {
  EventEmitter.call(this);

  this._state = state;
  this._chunkView = null;
  this._loader1 = attrs.loader1;
  this._loader2 = attrs.loader2;
  this._splashScreen = attrs.splashScreen;
  this._dataSource = attrs.dataSource;

  this._element = document.createElement('div');
  this._element.position = 'absolute';
  this._canvas = document.createElement('canvas');
  this._element.appendChild(this._splashScreen.element());
  this._splashScreen.setAnimate(false);

  this._yLabels = null;

  this._animate = false;
  this._animating = false;
  this._startYLabels = null;
  this._endYLabels = null;

  this._pixelRatio = 0;
  this._crystalCallback = this._updatePixelRatio.bind(this);
}

StateView.prototype = Object.create(EventEmitter.prototype);

// element returns the element for the view.
StateView.prototype.element = function() {
  return this._element;
};

// totalWidth gets the width of the StateView based on the current state.
// This will also account for the current animation.
StateView.prototype.totalWidth = function() {
  if (this._showingContent()) {
    return this._chunkView.getInherentWidth() + this._chunkView.getRightOffset() +
      this._chunkView.getLeftOffset() + this._state.positive.leftmostYLabelsWidth;
  } else {
    return 0;
  }
};

// draw instructs the StateView to draw itself given the current state.
// This will also account for the current animation.
StateView.prototype.draw = function() {
  if (!this._showingContent()) {
    return;
  }

  this._drawCanvas();
  // TODO: position the inline loaders if necessary.
};

// setAnimate enables/disables animations on the StateView.
StateView.prototype.setAnimate = function(flag) {
  if (flag === this._animate) {
    return;
  }
  this._animate = flag;

  if (this._animate) {
    window.crystal.addListener(this._crystalCallback);
    this._updatePixelRatio();
  } else {
    window.crystal.removeListener(this._crystalCallback);
  }

  if (this._showingContent()) {
    this._chunkView.setAnimate(flag);
  } else {
    this._splashScreen.setAnimate(flag);
  }
};

// dispose removes a StateView's references to the provider, data source, and ChunkView.
StateView.prototype.dispose = function() {
  this.setAnimate(false);
};

// updateState indicates that the state changed for some reason other than a deletion, addition, or
// modification of a data point or from invalidation of the data set.
StateView.prototype.updateState = function(newState) {
  // TODO: update this._chunkView if necessary.
  // TODO: update the y-axis labels if necessary.
  // TODO: update other local state such as load timeouts if necessary.

  this._state = newState;

  this._splashScreen.layout(this._state.positive.viewportWidth,
    this._state.positive.viewportHeight);
  this._element.style.width = this._state.positive.viewportWidth.toFixed(2) + 'px';
  this._element.style.height = this._state.positive.viewportHeight.toFixed(2) + 'px';
};

// updateStateDeletion indicates that the state changed specifically due to a deletion.
StateView.prototype.updateStateDelete = function(newState, oldIndex, inVisibleChunk) {
  // TODO: this.
};

// updateStateAdd indicates that the state changed specifically due to an addition.
StateView.prototype.updateStateAdd = function(newState) {
  // TODO: this.
};

// updateStateModify indicates that the state changed specifically due to a modification.
StateView.prototype.updateStateModify = function(newState, index) {
  // TODO: this.
};

// updateStateInvalidate indicates that the state changed specifically due to a data invalidation.
StateView.prototype.updateStateInvalidate = function(newState) {
  // TODO: this.
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
  if (this._showingContent()) {
    this._drawCanvas();
  }
};

StateView.prototype._showingContent = function() {
  return this._chunkView !== null && !this._state.normative.needsLeftmostChunk;
};
