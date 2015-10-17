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
}

StateView.prototype = Object.create(EventEmitter.prototype);

// element returns the element for the view.
StateView.prototype.element = function() {
  return this._element;
};

// totalWidth gets the width of the StateView based on the current state.
// This will also account for the current animation.
StateView.prototype.totalWidth = function() {
  // TODO: this.
  return 0;
};

// draw instructs the StateView to draw itself given the current state.
// This will also account for the current animation.
StateView.prototype.draw = function() {
  // TODO: draw the current state here.
};

// setAnimate enables/disables animations on the StateView.
StateView.prototype.setAnimate = function(flag) {
  // TODO: this.
};

// dispose removes a StateView's references to the provider, data source, and ChunkView.
StateView.prototype.dispose = function() {
  this.setAnimate(false);
  // TODO: this.
};

// updateState indicates that the state changed for some reason other than a deletion, addition, or
// modification of a data point or from invalidation of the data set.
StateView.prototype.updateState = function(newState) {
  // TODO: update the chunkView here.
  this._state = newState;
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
