// This implements a datasource that returns elements from an array.
(function() {
  
  // Create a new ArrayDataSource with given values.
  function ArrayDataSource(values) {
    this.values = values;
  }
  
  // Run a callback with the number of values.
  ArrayDataSource.prototype.count = function(callback) {
    return fakeAsync(function() {
      callback(null, this.values.length);
    }.bind(this));
  }
  
  // Run a callback with a slice of the values.
  ArrayDataSource.prototype.query = function(start, end, callback) {
    return fakeAsync(function() {
      if (start < 0) {
        callback(new Error('Invalid start index: ' + start), null);
      } else if (start > this.values.length) {
        callback(new Error('Invalid start index: ' + start), null);
      } else if (end < start || end > this.values.length) {
        callback(new Error('Invalid end index: ' + end), null);
      } else {
        callback(null, this.values.slice(start, end));
      }
    }.bind(this));
  }
  
  // Use setTimeout() to run a call on another runloop iteration and return a
  // ticket which can cancel the timeout.
  function fakeAsync(call) {
    var ts;
    ts = setTimeout(function() {
      ts = null;
      call();
    }, 10);
    
    // Return a ticket which cancels the timeout.
    return {
      cancel: function() {
        if (ts != null) {
          clearTimeout(ts);
        }
      }
    };
  }
  
  if (!window.graphalicious) {
    window.graphalicious = {ArrayDataSource: ArrayDataSource};
  } else {
    window.graphalicious.ArrayDataSource = ArrayDataSource;
  }
  
})();