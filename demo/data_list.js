(function() {

  // The DataList shows a concise list of values in the data set.
  // This list is useful for quickly identifying the indices of various values.
  function DataList(dataSource) {
    this._dataSource = dataSource;
    this._element = document.getElementById('data-list');
    this._rowElements = [];

    this._initializeRowElements();
    this._registerEvents();
  }

  DataList.prototype._initializeRowElements = function() {
    for (var i = this._dataSource.getLength()-1; i >= 0; --i) {
      var el = generateRow(this._dataSource.getDataPoint(i), i);
      this._rowElements[i] = el;
      this._element.appendChild(el);
    }
  };

  DataList.prototype._registerEvents = function() {
    var events = ['insert', 'modify', 'delete'];
    for (var i = 0; i < events.length; ++i) {
      this._dataSource.on(events[i], function() {
        this._element.innerHTML = '';
        this._rowElements = [];
        this._initializeRowElements();
      }.bind(this));
    }
  };

  function generateRow(dataPoint, index) {
    var el = document.createElement('div');
    el.className = 'data-list-row';

    var valueLabel = document.createElement('label');
    valueLabel.className = 'data-list-row-primary';
    valueLabel.innerText = dataPoint.primary;

    var indexLabel = document.createElement('label');
    indexLabel.className = 'data-list-row-index';
    indexLabel.innerText = index;

    el.appendChild(valueLabel);
    el.appendChild(indexLabel);

    return el;
  }

  window.DataList = DataList;

})();
