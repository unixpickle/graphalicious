(function() {

  function Controls() {
    this._element = document.getElementById('controls');
    this._buttons = document.getElementsByClassName('controls-tab');
    this._pages = document.getElementsByClassName('controls-page');

    this._timeoutInput = document.getElementById('controls-data-timeout');
    this._successField = document.getElementById('controls-data-succeed');

    this._registerTabEvents();
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

  window.Controls = Controls;

})();