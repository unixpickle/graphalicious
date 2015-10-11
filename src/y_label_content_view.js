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

  if (this._state === YLabelContentView.STATE_SHOWING_CONTENT) {
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

exports.YLabelContentView = YLabelContentView;
