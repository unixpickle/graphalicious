//deps state_view.js

var LEFTMOST_CHUNK_INDEX = 0;
var VISIBLE_CHUNK_INDEX = 1;

// ContentView draws a ViewProvider with y-axis labels.
function ContentView(attrs) {
  this._currentState = new State(new PositiveState({}), new NormativeState({}));
  StateView.call(this, this._currentState, attrs);

  this._registerDataSourceEvents();
  this._registerProviderEvents();
  this._registerButtonEvents();
}

ContentView.prototype = Object.create(StateView.prototype);

ContentView.prototype.dispose = function() {
  StateView.prototype.dispose.call(this);

  this._dataSource.cancel(LEFTMOST_CHUNK_INDEX);
  this._dataSource.cancel(VISIBLE_CHUNK_INDEX);

  this._deregisterDataSourceEvents();
  this._deregisterProviderEvents();
};

ContentView.prototype.draw = function(viewportX, viewportWidth, height, barShowingHeight) {
  this._currentState.positive.viewportX = viewportX;
  this._currentState.positive.viewportWidth = viewportWidth;
  this._currentState.positive.viewportHeight = height;
  this._currentState.positive.barShowingHeight = barShowingHeight;
  this._recomputeLeftmostLabelWidth(false);
  this._updateNormativeState();
  this.updateState(this._currentState);
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
  if (chunkIndex === LEFTMOST_CHUNK_INDEX) {
    this._recomputeLeftmostLabelWidth();
    this._currentState.normative.needsLeftmostChunk = false;
    this._currentState.normative.loadingLeftmostChunk = false;
  } else {
    this._currentState.normative.needsVisibleChunk = false;
    this._currentState.normative.loadingVisibleChunk = false;
    var chunk = this._dataSource.getChunk(VISIBLE_CHUNK_INDEX);
    this._currentState.positive.visibleChunkStart = chunk.getStartIndex();
    this._currentState.positive.visibleChunkLength = chunk.getLength();
  }

  this.updateState(this._currentState);
};

ContentView.prototype._handleDataSourceError = function(chunkIndex) {
  if (chunkIndex === LEFTMOST_CHUNK_INDEX) {
    this._currentState.normative.loadingLeftmostChunk = false;
  } else {
    this._currentState.normative.loadingVisibleChunk = false;
  }
  this.updateState(this._currentState);
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
  var theoreticalChunk = {
    startIndex: 0,
    length: this._dataSource.getLength()
  };
  this._currentState.positive.contentWidth = this._provider.computeRegion(theoreticalChunk,
    theoreticalChunk.length).width;
  this._recomputeLeftmostLabelWidth(true);
  this._updateNormativeState();
  this.updateStateVisualStyleChange(this._currentState);
};

ContentView.prototype._registerButtonEvents = function() {
  var loaders = [this._loader1, this._loader2];
  for (var i = 0; i < 2; ++i) {
    var loader = loaders[i];
    loader.on('retry', function() {
      if (this._currentState.normative.needsVisibleChunk) {
        var oldState = new NormativeState(this._currentState.normative);
        this._currentState.normative.loadingVisibleChunk = true;
        this._handleNormativeChange(oldState);
      }
    }.bind(this));
  }
  this._splashScreen.on('retry', function() {
    var oldState = new NormativeState(this._currentState.normative);
    if (this._currentState.normative.needsVisibleChunk) {
      this._currentState.normative.loadingVisibleChunk = true;
    }
    if (this._currentState.normative.needsLeftmostChunk) {
      this._currentState.normative.loadingLeftmostChunk = true;
    }
    this._handleNormativeChange(oldState);
  }.bind(this));
};

ContentView.prototype._recomputeLeftmostLabelWidth = function(force) {
  var region = {
    left: 0,
    width: this._currentState.positive.viewportWidth
  };
  var useChunk = this._provider.computeTheoreticalChunk(region, this._dataSource.getLength());

  assert(useChunk.startIndex === 0);
  if (!force && useChunk.length === this._currentState.positive.leftmostYLabelsPointCount) {
    return;
  }

  var leftmostChunk = this._dataSource.getChunk(LEFTMOST_CHUNK_INDEX);
  if (leftmostChunk === null || useChunk.length > leftmostChunk.length) {
    this._currentState.positive.leftmostChunkLength = -1;
    this._currentState.positive.leftmostYLabelsWidth = -1;
    this._currentState.positive.leftmostYLabelsPointCount = -1;
    return;
  }

  var maxPoint = 0;
  for (var i = 0, len = useChunk.length; i < len; ++i) {
    maxPoint = Math.max(maxPoint, leftmostChunk.getDataPoint(i).primary);
  }

  var usableHeight = this._currentState.positive.barShowingHeight - this._topMargin -
    this._bottomMargin;
  if (usableHeight < 0) {
    usableHeight = 0;
  }
  var labels = this._labelGenerator.createLabels(maxPoint, usableHeight);
  this._currentState.positive.leftmostYLabelsWidth = labels.width();
  this._currentState.positive.leftmostYLabelsPointCount = useChunk.length;
};

// _updateNormativeState recomputes the current normative state and then starts/cancels operations
// on the DataSource accordingly.
ContentView.prototype._updateNormativeState = function() {
  var oldState = new NormativeState(this._currentState.normative);
  this._currentState.normative.recompute(this._provider, this._currentState.positive);
  this._handleNormativeChange(oldState);
};

// _handleNormativeChange starts/cancels operations on the DataSource according to changes in the
// normative state.
ContentView.prototype._handleNormativeChange = function(oldState) {
  var newState = this._currentState.normative;
  if (newState.loadingLeftmostChunk !== oldState.loadingLeftmostChunk) {
    if (newState.loadingLeftmostChunk) {
      this._dataSource.fetchChunk(LEFTMOST_CHUNK_INDEX, 0, newState.leftmostChunkLength);
    } else {
      this._dataSource.cancel(LEFTMOST_CHUNK_INDEX);
    }
  } else if (newState.loadingLeftmostChunk &&
             newState.leftmostChunkLength !== oldState.leftmostChunkLength) {
    this._dataSource.fetchChunk(LEFTMOST_CHUNK_INDEX, 0, newState.leftmostChunkLength);
  }

  if (newState.loadingVisibleChunk !== oldState.loadingVisibleChunk) {
    if (newState.loadingVisibleChunk) {
      this._dataSource.fetchChunk(VISIBLE_CHUNK_INDEX, newState.visibleChunkStart,
        newState.visibleChunkLength);
    } else {
      this._dataSource.cancel(VISIBLE_CHUNK_INDEX);
    }
  } else if (newState.loadingVisibleChunk &&
             (newState.visibleChunkLength !== oldState.visibleChunkLength ||
              newState.visibleChunkStart !== oldState.visibleChunkStart)) {
    this._dataSource.fetchChunk(VISIBLE_CHUNK_INDEX, newState.visibleChunkStart,
      newState.visibleChunkLength);
  }
};

exports.ContentView = ContentView;
