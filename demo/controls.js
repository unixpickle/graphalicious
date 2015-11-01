(function() {

  function Controls() {
    this._element = document.getElementById('controls');
    this._buttons = document.getElementsByClassName('controls-tab');
    this._pages = document.getElementsByClassName('controls-page');

    for (var i = 0, len = this._buttons.length; i < len; ++i) {
      this._buttons[i].addEventListener('click', this._showPage.bind(this, i));
    }
  }

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