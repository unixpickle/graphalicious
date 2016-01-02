function BarGraphFadingHarp2() {
  BarGraph.call(this);
  this._disableBlurbTimeout = null;
  this._currentBlurb = null;
  this._fadeOut = true;
  this._fadeStart = 0;
  this._fadeFrame = null;
}

BarGraphFadingHarp2.IN_DELAY = 200;
BarGraphFadingHarp2.IN_DURATION = 90;
BarGraphFadingHarp2.OUT_DURATION = 150;
BarGraphFadingHarp2.SCROLL_DISABLE_TIME = 500;
BarGraphFadingHarp2.SHORT_BAR = 15;

BarGraphFadingHarp2.prototype = Object.create(BarGraph.prototype);
BarGraphFadingHarp2.prototype.constructor = BarGraphFadingHarp2;

BarGraphFadingHarp2.prototype.draw = function() {
  BarGraph.prototype.draw.call(this);
  this._drawBlurb();
};

BarGraphFadingHarp2.prototype.scroll = function() {
  if (this._disableBlurbTimeout !== null) {
    clearTimeout(this._disableBlurbTimeout);
  }
  this._disableBlurbTimeout = setTimeout(function() {
    this._disableBlurbTimeout = null;
    this.draw();
  }.bind(this), BarGraphFadingHarp2.SCROLL_DISABLE_TIME);
  BarGraph.prototype.scroll.call(this);
};

BarGraphFadingHarp2.prototype._drawBlurb = function() {
  var current = this._currentBar();
  if (current === null) {
    if (this._currentBlurb !== null) {
      this._startFadeOut();
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
    this._startFadeOut();
  }
  var fadeTime = (new Date().getTime() - this._fadeStart);
  if (this._fadeOut) {
    fadeTime /= BarGraphFadingHarp2.OUT_DURATION;
  } else {
    if (fadeTime < BarGraphFadingHarp2.IN_DELAY) {
      fadeTime = 0;
    } else {
      fadeTime -= BarGraphFadingHarp2.IN_DELAY;
      fadeTime /= BarGraphFadingHarp2.IN_DURATION;
    }
  }
  fadeTime = Math.min(fadeTime, 1);
  if (this._fadeOut) {
    fadeTime = 1 - fadeTime;
  }
  this._currentBlurb.opacity = fadeTime;
  this._currentBlurb.draw();
};

BarGraphFadingHarp2.prototype._currentBar = function() {
  if (this._disableBlurbTimeout !== null) {
    return null;
  }
  if (!mousePosition) {
    return null;
  }
  var offset = scrollView.getState().getScrolledPixels();
  var pointIndex = -1;
  var pointDistance = Infinity;
  for (var i = 0, len = this._points.length; i < len; ++i) {
    var x = (10 + i*45) + 20 - offset;
    var distance = Math.abs(x - mousePosition.x);
    if (distance < pointDistance) {
      pointIndex = i;
      pointDistance = distance;
    }
  }

  var viewport = this._viewportSize();
  var height = this._points[pointIndex] * (viewport.height - 10);
  var secondaryHeight = this._secondary[pointIndex] * (viewport.height - 10);

  if (mousePosition.y >= viewport.height-secondaryHeight) {
    return {
      index: pointIndex,
      primary: false,
      x: (10 + pointIndex*45) + 20 - offset,
      y: viewport.height - secondaryHeight,
      text: 'Secondary Value'
    };
  } else {
    return {
      index: pointIndex,
      primary: true,
      x: (10 + pointIndex*45) + 20 - offset,
      y: viewport.height - height,
      text: 'Primary Value'
    };
  }
};

BarGraphFadingHarp2.prototype._startFadeOut = function() {
  if (this._fadeFrame === null || !this._fadeOut) {
    if (this._fadeFrame !== null && !this._fadeOut) {
      var fadeTime = new Date().getTime() - this._fadeStart;
      var currentOpacity = 0;
      if (fadeTime >= BarGraphFadingHarp2.IN_DELAY) {
        currentOpacity = fadeTime;
        currentOpacity -= BarGraphFadingHarp2.IN_DELAY;
        currentOpacity /= BarGraphFadingHarp2.IN_DURATION;
        currentOpacity = Math.min(1, currentOpacity);
      }
      var timeElapsed = (1 - currentOpacity) * BarGraphFadingHarp2.OUT_DURATION;
      this._fadeStart = new Date().getTime() - timeElapsed;
    } else {
      this._fadeStart = new Date().getTime();
    }
    this._fadeOut = true;
  }
  if (this._fadeFrame === null) {
    this._fadeFrame = window.requestAnimationFrame(this._fadeTick.bind(this));
  }
};

BarGraphFadingHarp2.prototype._fadeTick = function() {
  var fadeTime = (new Date().getTime() - this._fadeStart);
  if (this._fadeOut) {
    fadeTime /= BarGraphFadingHarp2.OUT_DURATION;
  } else {
    if (fadeTime < BarGraphFadingHarp2.IN_DELAY) {
      fadeTime = 0;
    } else {
      fadeTime -= BarGraphFadingHarp2.IN_DELAY;
      fadeTime /= BarGraphFadingHarp2.IN_DURATION;
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
