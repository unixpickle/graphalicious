var EventEmitter = includeAPI('base').EventEmitter;

var LEFTMOST_CHUNK_INDEX = 0;
var VISIBLE_CHUNK_INDEX = 1;

// ContentView draws a ViewProvider with y-axis labels.
function ContentView(provider, dataSource, splashScreen) {
  EventEmitter.call(this);

  this._element = document.createElement('div');
  this._element.position = 'absolute';
  this._splashScreen = splashScreen;
  this._canvas = document.createElement('canvas');
  this._element.appendChild(splashScreen.element());
  splashScreen.setAnimate(false);

  this._pixelRatio = 0;

  this._provider = provider;
  this._dataSource = dataSource;

  this._chunkView = null;
  this._yLabels = null;
  this._keepRightOnNextChange = true;

  this._animating = false;
  this._startYLabels = null;
  this._endYLabels = null;

  this._positiveState = new PositiveState({});
  this._normativeState = new NormativeState({});

  this._animate = false;
  this._crystalCallback = this._pixelRatioChanged.bind(this);

  this._registerDataSourceEvents();
  this._registerProviderEvents();
}

ContentView.prototype = Object.create(EventEmitter.prototype);

ContentView.prototype.element = function() {
  return this._element;
};

ContentView.prototype.dispose = function() {
  this._dataSource.cancel(LEFTMOST_CHUNK_INDEX);
  this._dataSource.cancel(VISIBLE_CHUNK_INDEX);

  if (this._chunkView) {
    this._provider.destroyChunkView(this._chunkView);
  }

  this._deregisterDataSourceEvents();
  this._deregisterProviderEvents();
};

ContentView.prototype.totalWidth = function() {
  if (this._showingContent()) {
    return this._chunkView.getInherentWidth() + this._chunkView.getRightOffset() +
      this._chunkView.getLeftOffset() + this._positiveState.leftmostYLabelsWidth;
  } else {
    return 0;
  }
};

ContentView.prototype.setAnimate = function(animate) {
  if (animate === this._animate) {
    return;
  }
  this._animate = animate;

  if (animate) {
    window.crystal.addListener(this._crystalCallback);
    this._pixelRatioChanged();
  } else {
    window.crystal.removeListener(this._crystalCallback);
  }

  if (this._showingContent()) {
    this._chunkView.setAnimate(animate);
  } else {
    this._splashScreen.setAnimate(animate);
  }
};

ContentView.prototype.draw = function(viewportX, viewportWidth, height, barShowingHeight) {
  // TODO: update the positive state here and then update the normative state based on it.
  // TODO: update the size of the canvas if necessary.
  if (!this._showingContent()) {
    this._splashScreen.layout(viewportWidth, height);
  } else {
    this._drawCanvas();
    // TODO: position the inline loaders if necessary.
  }
};

ContentView.prototype._redraw = function() {
  this.draw(this._positiveState.viewportX, this._positiveState.viewportWidth,
    this._positiveState.viewportHeight, this._positiveState.barShowingHeight);
};

ContentView.prototype._drawCanvas = function() {
  // TODO: this.
};

ContentView.prototype._pixelRatioChanged = function() {
  var newRatio = Math.ceil(window.crystal.getRatio());
  if (this._pixelRatio === newRatio) {
    return;
  }
  this._pixelRatio = newRatio;
  this._canvas.width = this._positiveState.viewportWidth * newRatio;
  this._canvas.height = this._positiveState.viewportHeight * newRatio;
  if (this._showingContent()) {
    this._drawCanvas();
  }
};

ContentView.prototype._handleNormativeChange = function(oldState) {
  if (this._normativeState.loadingLeftmostChunk !== oldState.loadingLeftmostChunk) {
    if (this._normativeState.loadingLeftmostChunk) {
      this._dataSource.fetchChunk(LEFTMOST_CHUNK_INDEX, 0,
        this._normativeState.leftmostChunkLength);
    } else {
      this._dataSource.cancel(LEFTMOST_CHUNK_INDEX);
    }
  } else if (this._normativeState.loadingLeftmostChunk &&
             this._normativeState.leftmostChunkLength !== oldState.leftmostChunkLength) {
    this._dataSource.fetchChunk(LEFTMOST_CHUNK_INDEX, 0, this._normativeState.leftmostChunkLength);
  }

  if (this._normativeState.loadingVisibleChunk !== oldState.loadingVisibleChunk) {
    if (this._normativeState.loadingVisibleChunk) {
      this._dataSource.fetchChunk(VISIBLE_CHUNK_INDEX, this._normativeState.visibleChunkStart,
        this._normativeState.visibleChunkLength);
    } else {
      this._dataSource.cancel(VISIBLE_CHUNK_INDEX);
    }
  } else if (this._normativeState.loadingVisibleChunk &&
             (this._normativeState.visibleChunkLength !== oldState.visibleChunkLength ||
              this._normativeState.visibleChunkStart !== oldState.visibleChunkStart)) {
    this._dataSource.fetchChunk(VISIBLE_CHUNK_INDEX, this._normativeState.visibleChunkStart,
      this._normativeState.visibleChunkLength);
  }
};

ContentView.prototype._showingContent = function() {
  return this._chunkView !== null && !this._normativeState.needsLeftmostChunk;
};

ContentView.prototype._registerDataSourceEvents = function() {
  this._boundDataSourceEvents = {};
  var eventNames = ['Load', 'Error', 'Delete', 'Add', 'Modify', 'Invalidate'];
  for (var i = 0, len = eventNames.length; i < len; ++i) {
    var eventName = eventNames[i];
    var handler = this['_handleDataSource' + eventName].bind(this);
    this._boundDataSourceEvents[eventName.toLowerCase()] = handler;
    this._dataSource.on(eventName.toLowerCase(), handler)
  }
};

ContentView.prototype._deregisterDataSourceEvents = function() {
  var keys = Object.keys(this._boundDataSourceEvents);
  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i];
    this._dataSource.removeListener(key, this._boundDataSourceEvents[key])
  }
};

ContentView.prototype._handleDataSourceLoad = function(chunkIndex) {
  // TODO: this.
};

ContentView.prototype._handleDataSourceError = function(chunkIndex) {
  // TODO: this.
};

ContentView.prototype._handleDataSourceDelete = function(oldIndex, inChunk0, inChunk1) {
  // TODO: this.
};

ContentView.prototype._handleDataSourceAdd = function() {
  // TODO: this.
};

ContentView.prototype._handleDataSourceModify = function(index) {
  // TODO: this.
};

ContentView.prototype._handleDataSourceInvalidate = function() {
  // TODO: this.
};

ContentView.prototype._registerProviderEvents = function() {
  this._boundProviderChange = this._handleProviderChange.bind(this);
  this._provider.on('change', this._boundProviderChange);
};

ContentView.prototype._deregisterProviderEvents = function() {
  this._provider.removeListener('change', this._boundProviderChange);
};

ContentView.prototype._handleProviderChange = function() {
  // TODO: this.
};

exports.ContentView = ContentView;
