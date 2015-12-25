(function() {

  function Controls(dataSource, view, colorScheme) {
    this._graphStyles = {
      bar: {
        colorScheme: colorScheme,
        leftMargin: 10,
        rightMargin: 10,
        barSpacing: 5,
        barWidth: 30
      },
      dot: {
        colorScheme: colorScheme,
        leftMargin: 10,
        rightMargin: 10,
        dotSpacing: 20,
        dotSize: 10,
        bottomMargin: 5
      },
      curve: {
        colorScheme: colorScheme,
        leftMargin: 10,
        rightMargin: 10,
        dotSpacing: 20,
        dotSize: 10,
        bottomMargin: 5,
        dotStrokeWidth: 2,
        dotStrokeColor: 'white'
      },
      full: {
        colorScheme: colorScheme,
        leftMargin: 10,
        rightMargin: 10,
        lineThickness: 4,
        minWidth: 250
      }
    };
    this._view = view;

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

    this._updateButton = document.getElementById('update-button');
    this._updateValue = document.getElementById('update-value');
    this._updateIndex = document.getElementById('update-index');

    this._deleteButton = document.getElementById('delete-button');
    this._deleteIndex = document.getElementById('delete-index');

    this._invalidateButton = document.getElementById('invalidate-button');

    this._graphTypeDropdown = document.getElementById('graph-type-dropdown');

    this._registerTabEvents();
    this._registerActionEvents();
    this._registerProviderEvents();

    this._updateContent();
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
      var val = parseDataPoint(this._insertValue.value);
      var idx = parseInt(this._insertIndex.value);
      if (val === null || isNaN(idx)) {
        alert('invalid value or index');
        return;
      }
      this._dataSource.insert(idx, val);
    }.bind(this));

    this._updateButton.addEventListener('click', function() {
      var val = parseDataPoint(this._updateValue.value);
      var idx = parseInt(this._updateIndex.value);
      if (val === null || isNaN(idx)) {
        alert('invalid value or index');
        return;
      }
      this._dataSource.modify(idx, val);
    }.bind(this));

    this._deleteButton.addEventListener('click', function() {
      var idx = parseInt(this._deleteIndex.value);
      if (isNaN(idx)) {
        alert('invalid index');
        return;
      }
      this._dataSource.delete(idx);
    }.bind(this));

    this._invalidateButton.addEventListener('click', function() {
      this._dataSource.invalidate();
    }.bind(this));
  };

  Controls.prototype._registerProviderEvents = function() {
    this._graphTypeDropdown.addEventListener('change', this._updateContent.bind(this));
  };

  Controls.prototype._updateContent = function() {
    if (this._view.getContentView() !== null) {
      var content = this._view.getContentView();
      this._view.setContentView(null);
      content.dispose();
      this._dataSource.invalidate();
    }
    var style;
    switch (this._graphTypeDropdown.value) {
    case 'bar':
      style = new window.graphalicious.styles.BarStyle(this._graphStyles.bar);
      break;
    case 'dot':
      style = new window.graphalicious.styles.DotStyle(this._graphStyles.dot);
      break;
    case 'curve':
      style = new window.graphalicious.styles.CurveStyle(this._graphStyles.curve);
      break;
    case 'full':
      style = new window.graphalicious.styles.FullCurveStyle(this._graphStyles.full);
    }
    var colorScheme = this._graphStyles.bar.colorScheme;
    var interpretation = new window.graphalicious.ylcv.DurationInterpretation({});
    var config = {
      splashScreen: new window.SplashScreen(colorScheme),
      dataSource: this._dataSource,
      visualStyle: style,
      loader1: new window.SplashScreen(colorScheme),
      loader2: new window.SplashScreen(colorScheme),
      topMargin: 20,
      bottomMargin: 5,
      labelLeftMargin: 10,
      labelRightMargin: 10,
      labelColor: '#999',
      labelFont: '16px sans-serif',
      topLabelSpace: 10,
      minSpacing: 30,
      emphasizeRight: true,
      formatValue: interpretation.format.bind(interpretation),
      roundValue: interpretation.round.bind(interpretation)
    };
    var content = new window.graphalicious.ylcv.View(config);
    content.element().style.backgroundColor = 'white';
    this._view.setContentView(content);
  };

  function parseDataPoint(str) {
    if (str[0] === '!') {
      var res = parseDataPoint(str.substr(1));
      res.proper = false;
      return res;
    }
    var res = /^([0-9\.]*)(\/([0-9]*))?$/.exec(str);
    if (res === null) {
      return null;
    }
    return {
      primary: parseInt(res[1]) || 0,
      secondary: parseInt(res[3]) || -1,
      proper: true
    };
  }

  window.Controls = Controls;

})();
