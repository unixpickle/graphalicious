function BarGraphAnimatingHarp() {
  BarGraph.call(this);

  this._currentBlurb = null;

  this._animationFrame = null;
  this._startBlurb = false;
  this._animationStart = 0;
}

BarGraphAnimatingHarp.DURATION = 200;

BarGraphAnimatingHarp.prototype = Object.create(BarGraph.prototype);
BarGraphAnimatingHarp.prototype.constructor = BarGraphAnimatingHarp;

BarGraphAnimatingHarp.prototype.draw = function() {
  BarGraph.prototype.draw.call(this);
  this._drawBlurb();
};

BarGraphAnimatingHarp.prototype._drawBlurb = function() {
  var current = this._currentBar();
  if (current === null) {
    this._currentBlurb = null;
    if (this._animationFrame !== null) {
      window.cancelAnimationFrame(this._animationFrame);
    }
    this._animationFrame = null;
    return;
  }
  if (this._currentBlurb === null) {
    this._currentBlurb = new Blurb();
    this._currentBlurb.text = current.text;
    this._currentBlurb.point = {x: current.x, y: current.y};
    this._currentBlurb.side = (current.x >= this._viewportSize().width/2 ?
      Blurb.LEFT : Blurb.RIGHT);
  } else if (this._currentBlurb.point.x !== current.x ||
      this._currentBlurb.point.y !== current.y) {
    this._startBlurb = this._intermediateBlurb();
    this._animationStart = new Date().getTime();
    this._currentBlurb = new Blurb();
    this._currentBlurb.text = current.text;
    this._currentBlurb.point = {x: current.x, y: current.y};
    this._currentBlurb.side = (current.x >= this._viewportSize().width/2 ?
      Blurb.LEFT : Blurb.RIGHT);
    if (this._animationFrame === null) {
      this._animationFrame = window.requestAnimationFrame(this._tick.bind(this));
    }
  }
  var intermediate = this._intermediateBlurb();
  intermediate.draw();
};

BarGraphAnimatingHarp.prototype._currentBar = function() {
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

BarGraphAnimatingHarp.prototype._intermediateBlurb = function() {
  if (this._animationFrame !== null) {
    var frac = (new Date().getTime() - this._animationStart) / BarGraphAnimatingHarp.DURATION;
    if (frac > 1) {
      frac = 1;
    }
    return Blurb.intermediate(this._startBlurb, this._currentBlurb, frac);
  } else {
    return this._currentBlurb;
  }
};

BarGraphAnimatingHarp.prototype._tick = function() {
  if (new Date().getTime()-this._animationStart < BarGraphAnimatingHarp.DURATION) {
    this._animationFrame = window.requestAnimationFrame(this._tick.bind(this));
  } else {
    this._animationFrame = null;
  }
  this.draw();
};
