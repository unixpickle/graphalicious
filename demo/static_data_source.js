(function() {

  var EventEmitter = window.graphalicious.base.EventEmitter;

  function StaticDataSource(dataPoints) {
    EventEmitter.call(this);
    this._dataPoints = dataPoints;
    this._chunks = [null, null];
    this._loading = [false, false];
  }

  StaticDataSource.random = function(count, maxValue, haveSecondary) {
    var points = [];
    for (var i = 0; i < count; ++i) {
      var val = Math.floor(Math.random() * maxValue);
      if (haveSecondary) {
        var secondary = Math.floor(Math.random() * val);
        points.push({primary: val, secondary: secondary});
      } else {
        points.push({primary: val, secondary: -1});
      }
    }
    return new StaticDataSource(points);
  };

  StaticDataSource.prototype = Object.create(EventEmitter.prototype);

  StaticDataSource.prototype.getLength = function() {
    return this._dataPoints.length;
  };

  StaticDataSource.prototype.getChunk = function(idx) {
    return this._chunks[idx];
  };

  StaticDataSource.prototype.getXAxisLabel = function(idx) {
    return idx + 1;
  };

  StaticDataSource.prototype.fetchChunk = function(idx, start, len) {
    this._chunks[idx] = null;
    this._loading[idx] = true;
    setTimeout(function() {
      if (!this._loading[idx]) {
        return;
      }
      this._loading[idx] = false;
      this._chunks[idx] = new StaticChunk(this._dataPoints, start, len);
      this.emit('load', idx);
    }.bind(this), 1);
  };

  function StaticChunk(points, start, len) {
    this._points = points;
    this._start = start;
    this._len = len;
  }

  StaticChunk.prototype.getStartIndex = function() {
    return this._start;
  };

  StaticChunk.prototype.getLength = function() {
    return this._len;
  };

  StaticChunk.prototype.getDataPoint = function(relIdx) {
    return this._points[start+relIdx];
  };
  
  window.StaticDataSource = StaticDataSource;

})();
