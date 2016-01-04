//deps includes.js

// A BlurbManager tracks and updates the current blurb, taking things like scrolling
// and resizing into account.
//
// This emits 'redraw' events whenever the blurb's state has changed
// in a way that was not directly caused by an update().
function BlurbManager(config) {
  EventEmitter.call(this);

  this._config = config;

  this._currentBlurb = null;
  this._currentBlurbViewport = null;
  this._currentBlurbScrollX = 0;

  this._lastViewport = null;
  this._lastScrollX = null;
  this._disableBlurbTimeout = null;

  this._boundBlurbRedraw = this._handleBlurbRedraw.bind(this);
  this._boundBlurbHidden = this._handleBlurbHidden.bind(this);
}

BlurbManager.CHANGE_DISABLE_TIME = 500;

BlurbManager.SMALL_VALUE = 0.001;
BlurbManager.NUMERICAL_VIEWPORT_KEYS = ['x', 'y', 'width', 'height', 'fullX', 'fullY',
  'fullWidth', 'fullHeight'];

BlurbManager.areValuesClose = function(v1, v2) {
  return Math.abs(v1 - v2) < BlurbManager.SMALL_VALUE;
};

BlurbManager.numericalViewportsEqual = function(v1, v2) {
  for (var i = 0, len = BlurbManager.NUMERICAL_VIEWPORT_KEYS.length; i < len; ++i) {
    var key = BlurbManager.NUMERICAL_VIEWPORT_KEYS[i];
    if (!BlurbManager.areValuesClose(v1[key], v2[key])) {
      return false;
    }
  }
  return true;
};

BlurbManager.arePointsComparable = function(p1, p2) {
  return BlurbManager.areValuesClose(p1.x, p2.x) && BlurbManager.areValuesClose(p1.y, p2.y);
};

BlurbManager.copyNumericalViewport = function(v) {
  var res = {};
  for (var i = 0, len = BlurbManager.NUMERICAL_VIEWPORT_KEYS.length; i < len; ++i) {
    var key = BlurbManager.NUMERICAL_VIEWPORT_KEYS[i];
    res[key] = v[key];
  }
  return res;
};

BlurbManager.prototype = Object.create(EventEmitter.prototype);

// update updates the blurb's state using info from a ChunkView that is being drawn.
BlurbManager.prototype.update = function(animating, viewport, scrollX, point, text) {
  if (animating ||
      (this._lastViewport !== null &&
       !BlurbManager.numericalViewportsEqual(viewport, this._lastViewport)) ||
      (this._lastScrollX !== null &&
       !BlurbManager.areValuesClose(scrollX, this._lastScrollX))) {
    if (this._disableBlurbTimeout) {
      clearTimeout(this._disableBlurbTimeout);
    }
    this._disableBlurbTimeout = setTimeout(function() {
      this._disableBlurbTimeout = null;
      this.emit('redraw');
    }.bind(this), BlurbManager.CHANGE_DISABLE_TIME);
  }

  this._lastViewport = BlurbManager.copyNumericalViewport(viewport);
  this._lastScrollX = scrollX;

  var shouldShowBlurb = (text !== null && this._disableBlurbTimeout === null);
  if (!shouldShowBlurb) {
    if (this._currentBlurb !== null) {
      this._currentBlurb.fadeOut();
    }
    return;
  }

  if (this._currentBlurb === null) {
    this._currentBlurb = new Blurb(viewport, this._config, point, text);
    this._currentBlurb.fadeIn();
    this._currentBlurbScrollX = scrollX;
    this._currentBlurbViewport = this._lastViewport;
    this._currentBlurb.on('redraw', this._boundBlurbRedraw);
    this._currentBlurb.on('hidden', this._boundBlurbHidden);
    return;
  }

  if (BlurbManager.areValuesClose(this._currentBlurbScrollX, scrollX) &&
      BlurbManager.numericalViewportsEqual(this._currentBlurbViewport, viewport) &&
      BlurbManager.arePointsComparable(this._currentBlurb.getPoint(), point) &&
      this._currentBlurb.getText() === text) {
    this._currentBlurb.fadeIn();
  } else {
    this._currentBlurb.fadeOut();
  }
};

BlurbManager.prototype.blurb = function() {
  return this._currentBlurb;
};

BlurbManager.prototype._handleBlurbRedraw = function() {
  this.emit('redraw');
};

BlurbManager.prototype._handleBlurbHidden = function() {
  this._currentBlurb.removeListener('redraw', this._boundBlurbRedraw);
  this._currentBlurb.removeListener('hidden', this._boundBlurbHidden);
  this._currentBlurb = null;
  this.emit('redraw');
};
