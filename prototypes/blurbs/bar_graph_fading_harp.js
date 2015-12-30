function BarGraphFadingHarp() {
  BarGraph.call(this);
  this._currentBlurb = null;
  this._fadeOut = true;
  this._fadeStart = 0;
  this._fadeFrame = null;
}

BarGraphFadingHarp.DURATION = 150;

BarGraphFadingHarp.prototype = Object.create(BarGraph.prototype);
BarGraphFadingHarp.prototype.constructor = BarGraphFadingHarp;

BarGraphFadingHarp.prototype.draw = function() {
  BarGraph.prototype.draw.call(this);
  this._drawBlurb();
};

BarGraphFadingHarp.prototype._drawBlurb = function() {
  var current = this._currentBar();
  if (current === null) {
    if (this._fadeFrame === null && this._currentBlurb !== null) {
      this._fadeFrame = window.requestAnimationFrame(this._fadeTick.bind(this));
      this._fadeOut = true;
      this._fadeStart = new Date().getTime();
    } else if (this._currentBlurb === null) {
      return;
    }
  } else if (this._currentBlurb === null) {
    this._currentBlurb = new Blurb();
    this._currentBlurb.text = current.text;
    this._currentBlurb.side = (current.x >= this._viewportSize().width/2 ? Blurb.LEFT : Blurb.RIGHT);
    this._currentBlurb.point = {x: current.x, y: current.y};
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
  var fadeTime = (new Date().getTime() - this._fadeStart) / BarGraphFadingHarp.DURATION;
  fadeTime = Math.min(fadeTime, 1);
  if (this._fadeOut) {
    fadeTime = 1 - fadeTime;
  }
  this._currentBlurb.opacity = fadeTime;
  this._currentBlurb.draw();
};

BarGraphFadingHarp.prototype._currentBar = function() {
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

BarGraphFadingHarp.prototype._fadeTick = function() {
  var fadeTime = (new Date().getTime() - this._fadeStart) / BarGraphFadingHarp.DURATION;
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
