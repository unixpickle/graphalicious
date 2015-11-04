(function() {

  function Controls(dataSource) {
    this._dataSource = dataSource;
    this._dataSource.loadTimeout = this.loadTimeout.bind(this);
    this._dataSource.loadSuccess = this.loadSuccess.bind(this);

    this._element = document.getElementById('controls');
    this._buttons = document.getElementsByClassName('controls-tab');
    this._pages = document.getElementsByClassName('controls-page');

    this._timeoutInput = document.getElementById('controls-data-timeout');
    this._successField = document.getElementById('controls-data-succeed');

    this._insertButton = document.getElementById('insert-button');
    this._insertValue = document.getElementById('insert-value');
    this._insertIndex = document.getElementById('insert-index');

    this._deleteButton = document.getElementById('delete-button');
    this._deleteIndex = document.getElementById('delete-index');

    this._invalidateButton = document.getElementById('invalidate-button');

    this._registerTabEvents();
    this._registerActionEvents();
  }

  Controls.prototype.loadTimeout = function() {
    return parseInt(this._timeoutInput.value) || 1;
  };

  Controls.prototype.loadSuccess = function() {
    return this._successField.checked;
  };

  Controls.prototype._registerTabEvents = function() {
    for (var i = 0, len = this._buttons.length; i < len; ++i) {
      this._buttons[i].addEventListener('click', this._showPage.bind(this, i));
    }
  };

  Controls.prototype._showPage = function(idx) {
    for (var i = 0, len = this._pages.length; i < len; ++i) {
      if (i === idx) {
        this._buttons[i].className = 'controls-tab controls-tab-current';
        this._pages[i].className = 'controls-page controls-page-current';
      } else {
        this._buttons[i].className = 'controls-tab';
        this._pages[i].className = 'controls-page';
      }
    }
  };

  Controls.prototype._registerActionEvents = function() {
    this._insertButton.addEventListener('click', function() {
      var val = parseInt(this._insertValue.value);
      var idx = parseInt(this._insertIndex.value);
      if (isNaN(val) || isNaN(idx)) {
        alert('invalid value or index');
        return;
      }
      this._dataSource.insert(idx, {primary: val, secondary: -1});
    }.bind(this));

    this._deleteButton.addEventListener('click', function() {
      var idx = parseInt(this._deleteIndex.value);
      if (isNaN(idx)) {
        alert('invalid index');
      }
      this._dataSource.delete(idx);
    }.bind(this));

    this._invalidateButton.addEventListener('click', function() {
      this._dataSource.invalidate();
    }.bind(this));
  };

  window.Controls = Controls;

})();