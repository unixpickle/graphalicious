(function() {

  var EventEmitter = window.graphalicious.base.EventEmitter;

  function DemoDataSource(dataPoints) {
    EventEmitter.call(this);
    this._dataPoints = dataPoints;
    this._chunks = [null, null];
    this._loading = [false, false];

    this.loadTimeout = 10;
    this.loadSuccess = true;
  }

  DemoDataSource.random = function(count, maxValue, haveSecondary) {
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
    return new DemoDataSource(points);
  };

  DemoDataSource.prototype = Object.create(EventEmitter.prototype);

  DemoDataSource.prototype.getLength = function() {
    return this._dataPoints.length;
  };

  DemoDataSource.prototype.getChunk = function(idx) {
    return this._chunks[idx];
  };

  DemoDataSource.prototype.getXAxisLabel = function(idx) {
    return idx + 1;
  };

  DemoDataSource.prototype.fetchChunk = function(idx, start, len) {
    this._loading[idx] = true;
    setTimeout(function() {
      if (!this._loading[idx]) {
        return;
      }
      this._loading[idx] = false;

      if (!this.loadSuccess) {
        this.emit('error', idx);
        return;
      }

      this._chunks[idx] = new StaticChunk(this._dataPoints, start, len);
      this.emit('load', idx);
    }.bind(this), this.loadTimeout);
  };

  DemoDataSource.prototype.delete = function(index) {
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

  DemoDataSource.prototype.insert = function(index, point) {
    var inChunk = [];
    for (var i = 0; i < 2; ++i) {
      inChunk[i] = false;

      var chunk = this._chunks[i];
      if (chunk === null) {
        continue;
      }

      if (index >= chunk._start && index < chunk._start+chunk._len) {
        ++chunk._len;
        inChunk[i] = true;
      } else if (index < chunk._start) {
        ++chunk._start;
      }
    }

    this._dataPoints.splice(index, 0, point);
    this.emit('insert', index);
  };

  DemoDataSource.prototype.modify = function(index, newPoint) {
    this._dataPoints[index] = newPoint;
    this.emit('modify', index);
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
    return this._points[this._start+relIdx];
  };

  window.DemoDataSource = DemoDataSource;

})();
