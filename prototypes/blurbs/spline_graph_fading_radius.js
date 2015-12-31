function SplineGraphFadingRadius() {
  SplineGraph.call(this);
  this._disableBlurbTimeout = null;
  this._currentBlurb = null;
  this._fadeOut = true;
  this._fadeStart = 0;
  this._fadeFrame = null;
}

SplineGraphFadingRadius.IN_DELAY = 200;
SplineGraphFadingRadius.IN_DURATION = 90;
SplineGraphFadingRadius.OUT_DURATION = 150;
SplineGraphFadingRadius.SCROLL_DISABLE_TIME = 500;
SplineGraphFadingRadius.DOT_RADIUS = 30;
SplineGraphFadingRadius.LOW_POINT = 30;

SplineGraphFadingRadius.prototype = Object.create(SplineGraph.prototype);
SplineGraphFadingRadius.prototype.constructor = SplineGraphFadingRadius;

SplineGraphFadingRadius.prototype.draw = function() {
  SplineGraph.prototype.draw.call(this);
  this._drawBlurb();
};

SplineGraphFadingRadius.prototype.scroll = function() {
  if (this._disableBlurbTimeout !== null) {
    clearTimeout(this._disableBlurbTimeout);
  }
  this._disableBlurbTimeout = setTimeout(function() {
    this._disableBlurbTimeout = null;
    this.draw();
  }.bind(this), SplineGraphFadingRadius.SCROLL_DISABLE_TIME);
  SplineGraph.prototype.scroll.call(this);
};

SplineGraphFadingRadius.prototype._drawBlurb = function() {
  var current = this._currentDot();
  if (current === null) {
    if (this._fadeFrame === null && this._currentBlurb !== null) {
      this._fadeFrame = window.requestAnimationFrame(this._fadeTick.bind(this));
      this._fadeOut = true;
      this._fadeStart = new Date().getTime();
    } else if (this._currentBlurb === null) {
      return;
    }
  } else if (this._currentBlurb === null) {
    this._currentBlurb = Blurb.create(current, current.text);
    if (this._fadeFrame === null) {
      this._fadeFrame = window.requestAnimationFrame(this._fadeTick.bind(this));
    }
    this._fadeOut = false;
    this._fadeStart = new Date().getTime();
  } else if (current.x !== this._currentBlurb.point.x ||
             current.y !== this._currentBlurb.point.y) {
    if (this._fadeFrame === null || !this._fadeOut) {
      this._fadeOut = true;
      this._fadeStart = new Date().getTime();
      this._fadeFrame = window.requestAnimationFrame(this._fadeTick.bind(this));
    }
  }
  var fadeTime = (new Date().getTime() - this._fadeStart);
  if (this._fadeOut) {
    fadeTime /= SplineGraphFadingRadius.OUT_DURATION;
  } else {
    if (fadeTime < SplineGraphFadingRadius.IN_DELAY) {
      fadeTime = 0;
    } else {
      fadeTime -= SplineGraphFadingRadius.IN_DELAY;
      fadeTime /= SplineGraphFadingRadius.IN_DURATION;
    }
  }
  fadeTime = Math.min(fadeTime, 1);
  if (this._fadeOut) {
    fadeTime = 1 - fadeTime;
  }
  this._currentBlurb.opacity = fadeTime;
  this._currentBlurb.draw();
};

SplineGraphFadingRadius.prototype._currentDot = function() {
  if (this._disableBlurbTimeout !== null) {
    return null;
  }
  if (!mousePosition) {
    return null;
  }
  var viewport = this._viewportSize();
  var distance = SplineGraphFadingRadius.DOT_RADIUS;
  var currentInfo = null;
  var offset = scrollView.getState().getScrolledPixels();
  for (var i = 0, len = this._points.length; i < len; ++i) {
    var x = (10 + i*50) - offset + 5;
    var primY = viewport.height - (this._points[i] * (viewport.height - 15) + 5);
    var secY = viewport.height - (this._secondary[i] * (viewport.height - 15) + 5);
    var primaryDistance = Math.sqrt(Math.pow(x - mousePosition.x, 2) +
      Math.pow(primY - mousePosition.y, 2));
    var secondaryDistance = Math.sqrt(Math.pow(x - mousePosition.x, 2) +
      Math.pow(secY - mousePosition.y, 2));
    if (primaryDistance <= distance) {
      distance = primaryDistance;
      currentInfo = {
        x: x,
        y: primY,
        primary: true,
        index: i,
        text: 'Primary Value'
      };
    }
    if (secondaryDistance <= distance) {
      distance = secondaryDistance;
      currentInfo = {
        x: x,
        y: secY,
        primary: false,
        index: i,
        text: 'Secondary Value'
      };
    }
  }

  return currentInfo;
};

SplineGraphFadingRadius.prototype._fadeTick = function() {
  var fadeTime = (new Date().getTime() - this._fadeStart);
  if (this._fadeOut) {
    fadeTime /= SplineGraphFadingRadius.OUT_DURATION;
  } else {
    if (fadeTime < SplineGraphFadingRadius.IN_DELAY) {
      fadeTime = 0;
    } else {
      fadeTime -= SplineGraphFadingRadius.IN_DELAY;
      fadeTime /= SplineGraphFadingRadius.IN_DURATION;
    }
  }
  if (fadeTime >= 1) {
    this._fadeFrame = null;
    if (this._fadeOut) {
      this._currentBlurb = null;
    }
  } else {
    this._fadeFrame = window.requestAnimationFrame(this._fadeTick.bind(this));
  }
  this.draw();
};
