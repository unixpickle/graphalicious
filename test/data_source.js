(function() {

  var EventEmitter;
  if ('undefined' !== typeof window) {
    EventEmitter = window.EventEmitter;
  } else {
    EventEmitter = require('events').EventEmitter;
  }

  function TestDataSource(dataPoints) {
    EventEmitter.call(this);
    this._dataPoints = dataPoints;
    this._chunks = [null, null];
    this._timeouts = [null, null];

    this.loadTimeout = function() {
      return 3000;
    };

    this.loadSuccess = function() {
      return true;
    };
  }

  TestDataSource.random = function(count, maxValue, haveSecondary) {
    var points = [];
    for (var i = 0; i < count; ++i) {
      var val = Math.floor(Math.random() * maxValue);
      if (haveSecondary) {
        var secondary = Math.floor(Math.random() * val);
        points.push({primary: val, secondary: secondary, proper: true});
      } else {
        points.push({primary: val, secondary: -1, proper: true});
      }
    }
    return new TestDataSource(points);
  };

  TestDataSource.prototype = Object.create(EventEmitter.prototype);
  TestDataSource.prototype.constructor = TestDataSource;

  TestDataSource.prototype.getLength = function() {
    return this._dataPoints.length;
  };

  TestDataSource.prototype.getChunk = function(idx) {
    return this._chunks[idx];
  };

  TestDataSource.prototype.getXAxisLabel = function(idx) {
    return idx + 1;
  };

  TestDataSource.prototype.fetchChunk = function(idx, start, len) {
    if (this._timeouts[idx] !== null) {
      clearTimeout(this._timeouts[idx]);
    }
    this._timeouts[idx] = setTimeout(function() {
      this._timeouts[idx] = null;

      if (!this.loadSuccess()) {
        this.emit('error', idx);
        return;
      }

      this._chunks[idx] = new StaticChunk(this._dataPoints, start, len);
      this.emit('load', idx);
    }.bind(this), this.loadTimeout());
  };

  TestDataSource.prototype.cancel = function(index) {
    if (this.isLoadingChunk(index)) {
      clearTimeout(this._timeouts[index]);
    }
  };

  TestDataSource.prototype.isLoadingChunk = function(index) {
    return this._timeouts[index] !== null;
  };

  TestDataSource.prototype.fetchChunkSync = function(idx, start, len) {
    if (this.isLoadingChunk(idx)) {
      this.cancel(idx);
    }
    this._chunks[idx] = new StaticChunk(this._dataPoints, start, len);
    this.emit('load', idx);
    return this._chunks[idx];
  };

  TestDataSource.prototype.delete = function(index) {
    var inChunk = [];
    for (var i = 0; i < 2; ++i) {
      inChunk[i] = false;

      var chunk = this._chunks[i];
      if (chunk === null) {
        continue;
      }

      if (index >= chunk._start && index < chunk._start+chunk._len) {
        --chunk._len;
        inChunk[i] = true;
      } else if (index < chunk._start) {
        --chunk._start;
      }
    }

    this._dataPoints.splice(index, 1);
    this.emit('delete', index, inChunk[0], inChunk[1]);
  };

  TestDataSource.prototype.insert = function(index, point) {
    if (!point.hasOwnProperty('proper')) {
      point.proper = true;
    }

    for (var i = 0; i < 2; ++i) {
      var chunk = this._chunks[i];
      if (chunk === null) {
        continue;
      }
      if (index >= chunk._start && index <= chunk._start+chunk._len) {
        ++chunk._len;
      } else if (index < chunk._start) {
        ++chunk._start;
      }
    }

    this._dataPoints.splice(index, 0, point);
    this.emit('insert', index);
  };

  TestDataSource.prototype.invalidate = function() {
    // TODO: set some kind of 'invalid' flag on the chunks
    this._chunks = [null, null];
    this.cancel(0);
    this.cancel(1);
    this.emit('invalidate');
  };

  TestDataSource.prototype.modify = function(index, newPoint) {
    this._dataPoints[index] = newPoint;
    this.emit('modify', index);
  };

  TestDataSource.prototype.getDataPoint = function(index) {
    return this._dataPoints[index];
  };

  function StaticChunk(points, start, len) {
    this._points = points;
    this._start = Math.max(0, Math.min(this._points.length, start));
    this._len = Math.max(0, Math.min(this._points.length-this._start, len));
  }

  StaticChunk.prototype.getStartIndex = function() {
    return this._start;
  };

  StaticChunk.prototype.getLength = function() {
    return this._len;
  };

  StaticChunk.prototype.getDataPoint = function(relIdx) {
    var point = this._points[this._start+relIdx];
    var improperStr = (point.proper ? '' : '!');
    point.primaryTooltip = improperStr + point.primary;
    point.secondaryTooltip = improperStr + point.secondary;
    return point;
  };

  if ('undefined' !== typeof window) {
    window.TestDataSource = TestDataSource;
  } else {
    module.exports = TestDataSource;
  }

})();
