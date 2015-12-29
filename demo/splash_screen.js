(function() {

  var EventEmitter = window.EventEmitter;

  var SPINNER_SIZE = 30;
  var RETRY_SIZE = 46;
  var SPIN_RATE = 0.3;

  function SplashScreen(colorScheme) {
    EventEmitter.call(this);

    this._colorScheme = colorScheme;

    var container = document.createElement('div');
    container.innerHTML = SPINNER_SVG;
    this._spinner = container.firstChild;

    container.innerHTML = RETRY_BUTTON_SVG;
    this._retryButton = container.firstChild;

    layoutAndCenter(this._retryButton, RETRY_SIZE);
    layoutAndCenter(this._spinner, SPINNER_SIZE);

    this._element = document.createElement('div');
    this._element.style.position = 'absolute';
    this._element.style.top = '0';
    this._element.appendChild(this._spinner);

    this._animate = false;
    this._startTime = null;
    this._animationFrame = null;
    this._showingError = false;

    this._updateColorScheme();
    colorScheme.on('change', this._updateColorScheme.bind(this));

    // NOTE: this is necessary so that we catch the click event before the parent view does.
    this._retryButton.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }.bind(this));
    this._retryButton.addEventListener('click', function(e) {
      this.emit('retry');
    }.bind(this));
  }

  SplashScreen.prototype = Object.create(EventEmitter.prototype);
  SplashScreen.prototype.constructor = SplashScreen;

  SplashScreen.prototype.element = function() {
    return this._element;
  };

  SplashScreen.prototype.layout = function(width, height) {
    this._element.style.width = width.toFixed(1) + 'px';
    this._element.style.height = height.toFixed(1) + 'px';

    var maxSizeRatio = Math.sqrt(2);

    if (width < maxSizeRatio*RETRY_SIZE) {
      var w = (width / maxSizeRatio);
      this._retryButton.style.left = (width/2 - w/2).toFixed(1) + 'px';
      this._retryButton.style.width = w.toFixed(1) + 'px';
    } else {
      this._retryButton.style.left = (width/2 - RETRY_SIZE/2).toFixed(1) + 'px';
      this._retryButton.style.width = RETRY_SIZE;
    }

    if (width < maxSizeRatio*SPINNER_SIZE) {
      var w = (width / maxSizeRatio);
      this._spinner.style.left = (width/2 - w/2).toFixed(1) + 'px';
      this._spinner.style.width = (width / maxSizeRatio).toFixed(1) + 'px';
    } else {
      this._spinner.style.left = (width/2 - SPINNER_SIZE/2).toFixed(1) + 'px';
      this._spinner.style.width = SPINNER_SIZE;
    }
  };

  SplashScreen.prototype.setAnimate = function(animate) {
    if (this._animate === animate) {
      return;
    }
    this._animate = animate;
    if (animate && !this._showingError && this._animationFrame === null) {
      this._startSpinning();
    } else if (!animate && this._animationFrame !== null) {
      window.cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  };

  SplashScreen.prototype.showLoading = function() {
    if (!this._showingError) {
      return;
    }
    this._element.removeChild(this._retryButton);
    this._element.appendChild(this._spinner);
    this._showingError = false;
    if (this._animate) {
      this._startSpinning();
    }
  };

  SplashScreen.prototype.showError = function() {
    if (this._showingError) {
      return;
    }
    this._element.removeChild(this._spinner);
    this._element.appendChild(this._retryButton);
    this._showingError = true;
    if (this._animationFrame !== null) {
      window.cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  };

  SplashScreen.prototype._spin = function(time) {
    this._animationFrame = requestAnimationFrame(this._spin.bind(this));

    if (this._startTime === null) {
      this._startTime = time;
      return;
    }

    var angle = (time - this._startTime) * SPIN_RATE;
    this._setSpinnerAngle(angle % 360);
  };

  SplashScreen.prototype._setSpinnerAngle = function(angle) {
    var transform = 'rotate(' + angle.toFixed(2) + 'deg)';
    this._spinner.style.transform = transform;
    this._spinner.style.webkitTransform = transform;
    this._spinner.style.MozTransform = transform;
    this._spinner.style.msTransform = transform;
  };

  SplashScreen.prototype._startSpinning = function() {
    this._setSpinnerAngle(0);
    this._startTime = null;
    this._animationFrame = window.requestAnimationFrame(this._spin.bind(this));
  };

  SplashScreen.prototype._updateColorScheme = function() {
    this._spinner.style.color = this._colorScheme.getPrimary();
    this._retryButton.style.color = this._colorScheme.getPrimary();
  };

  function layoutAndCenter(element, size) {
    element.style.width = size + 'px';
    element.style.height = size + 'px';
    element.style.position = 'absolute';
    element.style.top = 'calc(50% - ' + (size/2) + 'px)';
  }

  var SPINNER_SVG = '<svg viewBox="0 0 1 1" version="1.1">' +
    '<g fill="currentColor"><rect fill="inherit" x="0.000000" y="0.000000" ' +
    'width="0.306931" height="0.306931" /><rect fill="inherit" x="0.000000" ' +
    'y="0.346535" width="0.306931" height="0.306931" /><rect fill="inherit" ' +
    'x="0.000000" y="0.693069" width="0.306931" height="0.306931" />' +
    '<rect fill="inherit" x="0.346535" y="0.000000" width="0.306931" ' +
    'height="0.306931" /><rect fill="inherit" x="0.346535" y="0.346535" ' +
    'width="0.306931" height="0.306931" /><rect fill="inherit" x="0.346535" ' +
    'y="0.693069" width="0.306931" height="0.306931" /><rect fill="inherit" ' +
    'x="0.693069" y="0.000000" width="0.306931" height="0.306931" />' +
    '<rect fill="inherit" x="0.693069" y="0.346535" width="0.306931" ' +
    'height="0.306931" /><rect fill="inherit" x="0.693069" y="0.693069" ' +
    'width="0.306931" height="0.306931" /></g></svg>';

  var RETRY_BUTTON_SVG = '<svg viewBox="2 2 46 46" version="1.1">' +
    '<g class="hoverable-button">' +
    '<circle cx="25" cy="25" fill="currentColor" r="23" />' +
    '<path d="M33.660254038,30 a10,10 0 1 1 0,-10' +
    'm-7.372666366,0 l7.372666366,0 l0,-7.372666366" ' +
    'stroke="white" fill="none" stroke-width="2" />' +
    '</g></svg>';

  window.SplashScreen = SplashScreen;

})();
