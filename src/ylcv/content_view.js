//deps state_view.js

var LEFTMOST_CHUNK_INDEX = 0;
var VISIBLE_CHUNK_INDEX = 1;

// ContentView draws a ViewProvider with y-axis labels.
function ContentView(attrs) {
  this._currentState = new State(new PositiveState({}), new NormativeState({}));
  StateView.call(this, this._currentState, attrs);

  this._provider = attrs.provider;
  this._dataSource = attrs.dataSource;
  this._labelGenerator = attrs.labelGenerator;
  this._topMargin = attrs.topMargin;
  this._bottomMargin = attrs.bottomMargin;

  this._registerDataSourceEvents();
  this._registerProviderEvents();
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
  this._recomputeNormativeState();
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
  var theoreticalChunk = {
    startIndex: 0,
    length: this._dataSource.getLength()
  };
  this._currentState.positive.contentWidth = this._provider.computeRegion(theoreticalChunk,
    theoreticalChunk.length).width;
  this._recomputeLeftmostLabelWidth(true);
  this._recomputeNormativeState();
  this.updateStateVisualStyleChange(this._currentState);
};

ContentView.prototype._recomputeLeftmostLabelWidth = function(force) {
  var region = {
    left: 0,
    width: this._currentState.positive.viewportWidth
  };
  var useChunk = this._provider.computeTheoreticalChunk(region, this._dataSource.getLength());

  assert(useChunk.start === 0);
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
  var labels = this._labelGenerator.createLabels(maxValue, usableHeight);
  this._currentState.positive.leftmostYLabelsWidth = labels;
  this._currentState.positive.leftmostYLabelsPointCount = useChunk.length;
};

ContentView.prototype._recomputeNormativeState = function() {
  this._currentState.normative.recompute(this._provider, this._currentState.positive);
};

exports.ContentView = ContentView;
