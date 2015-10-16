//deps event_emitter.js

var LEFTMOST_CHUNK_INDEX = 0;
var VISIBLE_CHUNK_INDEX = 1;

// YLabelContentView draws a ViewProvider with y-axis labels.
function YLabelContentView(provider, dataSource, splashScreen) {
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
  this._keepRightOnNextChange = false;

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

YLabelContentView.prototype = Object.create(EventEmitter.prototype);

YLabelContentView.prototype.element = function() {
  return this._element;
};

YLabelContentView.prototype.dispose = function() {
  this._dataSource.cancel(LEFTMOST_CHUNK_INDEX);
  this._dataSource.cancel(VISIBLE_CHUNK_INDEX);

  if (this._chunkView) {
    this._provider.destroyChunkView(this._chunkView);
  }

  this._deregisterDataSourceEvents();
  this._deregisterProviderEvents();
};

YLabelContentView.prototype.totalWidth = function() {
  if (this._showingContent()) {
    return this._chunkView.getInherentWidth() + this._chunkView.getRightOffset() +
      this._chunkView.getLeftOffset() + this._positiveState.leftmostYLabelsWidth;
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

YLabelContentView.prototype.draw = function(viewportX, viewportWidth, height, barShowingHeight) {
  // TODO: update the positive state here and then update the normative state based on it.
  // TODO: update the size of the canvas if necessary.
  if (!this._showingContent()) {
    this._splashScreen.layout(viewportWidth, height);
  } else {
    this._drawCanvas();
    // TODO: position the inline loaders if necessary.
  }
};

YLabelContentView.prototype._redraw = function() {
  this.draw(this._positiveState.viewportX, this._positiveState.viewportWidth,
    this._positiveState.viewportHeight, this._positiveState.barShowingHeight);
};

YLabelContentView.prototype._drawCanvas = function() {
  // TODO: this.
};

YLabelContentView.prototype._pixelRatioChanged = function() {
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

YLabelContentView.prototype._handleNormativeChange = function(oldState) {
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

YLabelContentView.prototype._showingContent = function() {
  return this._chunkView !== null && !this._normativeState.needsLeftmostChunk;
};

YLabelContentView.prototype._registerDataSourceEvents = function() {
  this._boundDataSourceEvents = {};
  var eventNames = ['Load', 'Error', 'Delete', 'Add', 'Modify', 'Invalidate'];
  for (var i = 0, len = eventNames.length; i < len; ++i) {
    var eventName = eventNames[i];
    var handler = this['_handleDataSource'][eventName].bind(this);
    this._boundDataSourceEvents[eventName.toLowerCase()] = handler;
    this._dataSource.on(eventName.toLowerCase(), handler)
  }
};

YLabelContentView.prototype._deregisterDataSourceEvents = function() {
  var keys = Object.keys(this._boundDataSourceEvents);
  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i];
    this._dataSource.removeListener(key, this._boundDataSourceEvents[key])
  }
};

YLabelContentView.prototype._handleDataSourceLoad = function(chunkIndex) {
  // TODO: this.
};

YLabelContentView.prototype._handleDataSourceError = function(chunkIndex) {
  // TODO: this.
};

YLabelContentView.prototype._handleDataSourceDelete = function(oldIndex, inChunk0, inChunk1) {
  // TODO: this.
};

YLabelContentView.prototype._handleDataSourceAdd = function() {
  // TODO: this.
};

YLabelContentView.prototype._handleDataSourceModify = function(index) {
  // TODO: this.
};

YLabelContentView.prototype._handleDataSourceInvalidate = function() {
  // TODO: this.
};

YLabelContentView.prototype._registerProviderEvents = function() {
  this._boundProviderChange = this._handleProviderChange.bind(this);
  this._provider.on('change', this._boundProviderChange);
};

YLabelContentView.prototype._deregisterProviderEvents = function() {
  this._provider.removeListener('change', this._boundProviderChange);
};

YLabelContentView.prototype._handleProviderChange = function() {
  // TODO: this.
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

  this.viewportX = attrs.viewportX || 0;
  this.contentWidth = attrs.contentWidth || 0;
  this.viewportWidth = attrs.viewportWidth || 0;
  this.viewportHeight = attrs.viewportHeight || 0;
  this.barShowingHeight = attrs.barShowingHeight || 0;
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

exports.YLabelContentView = YLabelContentView;
