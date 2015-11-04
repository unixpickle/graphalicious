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

  this._initializeState();
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
  if (this._currentState.positive.viewportWidth !== viewportWidth) {
    this.element().style.width = viewportWidth + 'px';
  }
  if (this._currentState.positive.viewportHeight !== height) {
    this.element().style.height = height + 'px';
  }
  if (this.shouldUpdateRequestedViewportX()) {
    this._currentState.positive.requestedViewportX = viewportX;
  }
  this._currentState.positive.viewportX = viewportX;
  this._currentState.positive.viewportWidth = viewportWidth;
  this._currentState.positive.viewportHeight = height;
  this._currentState.positive.barShowingHeight = barShowingHeight;
  this._recomputeLeftmostLabelWidth(false);
  this._updateNormativeState();
  this.updateState(this._currentState);
};

ContentView.prototype._initializeState = function() {
  this._recomputeContentWidthAndLength();
  this._currentState.positive.dataSourceLength = this._dataSource.getLength();
  this.updateStateVisualStyleChange(this._currentState);
};

ContentView.prototype._registerDataSourceEvents = function() {
  this._boundDataSourceEvents = {};
  var eventNames = ['Load', 'Error', 'Delete', 'Insert', 'Modify', 'Invalidate'];
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
    this._recomputeLeftmostLabelWidth(true);
    this._currentState.normative.needsLeftmostChunk = false;
    this._currentState.normative.loadingLeftmostChunk = false;
    var chunk = this._dataSource.getChunk(LEFTMOST_CHUNK_INDEX);
    this._currentState.positive.leftmostChunkLength = chunk.getLength();
  } else {
    this._currentState.normative.needsVisibleChunk = false;
    this._currentState.normative.loadingVisibleChunk = false;
    var chunk = this._dataSource.getChunk(VISIBLE_CHUNK_INDEX);
    this._currentState.positive.visibleChunkStart = chunk.getStartIndex();
    this._currentState.positive.visibleChunkLength = chunk.getLength();
  }
  this._assertStateChunkConsistency();
  this.updateState(this._currentState);
};

ContentView.prototype._handleDataSourceError = function(chunkIndex) {
  if (chunkIndex === LEFTMOST_CHUNK_INDEX) {
    this._currentState.normative.loadingLeftmostChunk = false;
  } else {
    this._currentState.normative.loadingVisibleChunk = false;
  }
  this._assertStateChunkConsistency();
  this.updateState(this._currentState);
};

ContentView.prototype._handleDataSourceDelete = function(oldIndex) {
  this._recomputeContentWidthAndLength();
  if (oldIndex < this._currentState.positive.leftmostChunkLength) {
    --this._currentState.positive.leftmostChunkLength;
    this._recomputeLeftmostLabelWidth(true);
  }
  if (oldIndex < this._currentState.positive.visibleChunkStart) {
    --this._currentState.positive.visibleChunkStart;
  } else if (oldIndex < this._currentState.positive.visibleChunkStart +
             this._currentState.positive.visibleChunkLength) {
    --this._currentState.positive.visibleChunkLength;
  }
  this._assertStateChunkConsistency();
  this._updateNormativeState();
  this.updateStateDelete(this._currentState, oldIndex);
};

ContentView.prototype._handleDataSourceInsert = function(index) {
  this._recomputeContentWidthAndLength();
  if (index <= this._currentState.positive.leftmostChunkLength) {
    ++this._currentState.positive.leftmostChunkLength;
    this._recomputeLeftmostLabelWidth(true);
  }
  if (index < this._currentState.positive.visibleChunkStart) {
    ++this._currentState.positive.visibleChunkStart;
  } else if (index <= this._currentState.positive.visibleChunkStart +
             this._currentState.positive.visibleChunkLength) {
    ++this._currentState.positive.visibleChunkLength;
  }
  this._assertStateChunkConsistency();
  this._updateNormativeState();
  this.updateStateInsert(this._currentState, index);
};

ContentView.prototype._handleDataSourceModify = function(index) {
  this._recomputeContentWidthAndLength();
  if (index < this._currentState.positive.leftmostChunkLength) {
    this._recomputeLeftmostLabelWidth(true);
  }
  this._assertStateChunkConsistency();
  this._updateNormativeState();
  this.updateStateModify(this._currentState, index);
};

ContentView.prototype._handleDataSourceInvalidate = function() {
  this._currentState.positive.leftmostChunkLength = -1;
  this._currentState.positive.visibleChunkLength = -1;
  this._currentState.positive.visibleChunkStart = -1;
  this._recomputeContentWidthAndLength();
  this._recomputeLeftmostLabelWidth(true);
  this._assertStateChunkConsistency();
  this._updateNormativeState();
  this.updateStateInvalidate(this._currentState);
};

ContentView.prototype._registerProviderEvents = function() {
  this._boundProviderChange = this._handleProviderChange.bind(this);
  this._provider.on('change', this._boundProviderChange);
};

ContentView.prototype._deregisterProviderEvents = function() {
  this._provider.removeListener('change', this._boundProviderChange);
};

ContentView.prototype._handleProviderChange = function() {
  this._recomputeContentWidthAndLength();
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
        this.updateState(this._currentState);
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
    this.updateState(this._currentState);
  }.bind(this));
};

ContentView.prototype._recomputeContentWidthAndLength = function() {
  this._currentState.positive.dataSourceLength = this._dataSource.getLength();
  var theoreticalChunk = {
    startIndex: 0,
    length: this._currentState.positive.dataSourceLength
  };
  this._currentState.positive.contentWidth = this._provider.computeRegion(theoreticalChunk,
    theoreticalChunk.length).width;
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

ContentView.prototype._assertStateChunkConsistency = function() {
  var chunk = this._dataSource.getChunk(VISIBLE_CHUNK_INDEX);
  if (chunk === null) {
    assert(this._currentState.positive.visibleChunkStart === -1);
    assert(this._currentState.positive.visibleChunkLength === -1);
  } else {
    assert(this._currentState.positive.visibleChunkStart === chunk.getStartIndex());
    assert(this._currentState.positive.visibleChunkLength === chunk.getLength());
  }

  chunk = this._dataSource.getChunk(LEFTMOST_CHUNK_INDEX);
  if (chunk === null) {
    assert(this._currentState.positive.leftmostChunkLength === -1);
  } else {
    assert(this._currentState.positive.leftmostChunkLength === chunk.getLength());
    assert(0 === chunk.getStartIndex());
  }
};

exports.ContentView = ContentView;
