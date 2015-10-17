//deps state_view.js

var LEFTMOST_CHUNK_INDEX = 0;
var VISIBLE_CHUNK_INDEX = 1;

// ContentView draws a ViewProvider with y-axis labels.
function ContentView(attrs) {
  this._currentState = new State(new PositiveState({}), new NormativeState({}));
  StateView.call(this, this._currentState, attrs);

  this._provider = attrs.provider;
  this._dataSource = attrs.dataSource;

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
