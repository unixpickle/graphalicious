(function() {

  var SPINNER_SIZE = 20;
  var RELOAD_SIZE = 24;
  var SPIN_RATE = 0.3;

  function SplashScreen(colorScheme) {
    window.graphalicious.EventEmitter.call(this);
    
    this._colorScheme = colorScheme;

    var container = document.createElement('div');
    container.innerHTML = SPINNER_SVG;
    this._spinner = container.firstChild;

    container.innerHTML = RELOAD_BUTTON_SVG;
    this._reloadButton = container.firstChild;
    this._reloadButton.style.cursor = 'pointer';

    layoutAndCenter(this._reloadButton, RELOAD_SIZE);
    layoutAndCenter(this._spinner, SPINNER_SIZE);

    this._element = document.createElement('div');
    this._element.appendChild(this._spinner);

    this._animate = false;
    this._startTime = null;
    this._animationFrame = null;
    this._showingError = false;

    this._updateColorScheme();
    colorScheme.on('change', this._updateColorScheme.bind(this));

    this._spinner.addEventListener('click', this.emit.bind(this, 'reload'));
  }

  SplashScreen.prototype = Object.create(window.graphalicious.EventEmitter.prototype);

  SplashScreen.prototype.element = function() {
    return this._element;
  };

  SplashScreen.prototype.layout = function(width, height) {
    this._element.width = width.toFixed(1) + 'px';
    this._element.height = height.toFixed(1) + 'px';
  };

  SplashScreen.prototype.setAnimate = function(animate) {
    this._animate = animate;
    if (animate && !this._showingError && this._animationFrame === null) {
      this._startSpinning();
    } else if (!animate && this._animationFrame !== null) {
      window.cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  };

  SplashScreen.prototype.start = function() {
    if (!this._showingError) {
      return;
    }
    this._element.removeChild(this._reloadButton);
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
    this._element.appendChild(this._reloadButton);
    this._showingError = false;
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
    this._reloadButton.style.color = this._colorScheme.getPrimary();
  };

  function layoutAndCenter(element, size) {
    element.style.width = size + 'px';
    element.style.height = size + 'px';
    element.style.position = 'absolute';
    element.style.top = 'calc(50% - ' + (size/2) + 'px)';
    element.style.left = 'calc(50% - ' + (size/2) + 'px)';
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

  var RELOAD_BUTTON_SVG = '<svg viewBox="12 12 26 26" version="1.1">' +
    '<path d="M33.660254038,30 a10,10 0 1 1 0,-10' +
    'm-7.372666366,0 l7.372666366,0 l0,-7.372666366" ' +
    'stroke="currentColor" fill="none" stroke-width="2" />' +
    '</svg>';

  window.SplashScreen = SplashScreen;

})();