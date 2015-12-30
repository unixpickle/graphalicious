function BarGraphFadingOver() {
  BarGraphFadingHarp2.call(this);
}

BarGraphFadingOver.MIN_BAR_HEIGHT = 30;

BarGraphFadingOver.prototype = Object.create(BarGraphFadingHarp2.prototype);
BarGraphFadingOver.prototype.constructor = BarGraphFadingOver;

BarGraphFadingOver.prototype._currentBar = function() {
  if (this._disableBlurbTimeout !== null) {
    return null;
  }
  if (!mousePosition) {
    return null;
  }
  var offset = scrollView.getState().getScrolledPixels();
  var pointIndex = -1;
  for (var i = 0, len = this._points.length; i < len; ++i) {
    var x = (10 + i*45) - offset;
    if (mousePosition.x >= x && mousePosition.x < x + 40) {
      pointIndex = i;
      break;
    }
  }

  var viewport = this._viewportSize();
  var height = this._points[pointIndex] * (viewport.height - 10);
  var secondaryHeight = this._secondary[pointIndex] * (viewport.height - 10);
  var boundedHeight = Math.max(height, BarGraphFadingOver.MIN_BAR_HEIGHT);

  if (mousePosition.y >= viewport.height-secondaryHeight) {
    return {
      index: pointIndex,
      primary: false,
      x: (10 + pointIndex*45) + 20 - offset,
      y: viewport.height - secondaryHeight,
      text: 'Secondary Value'
    };
  } else if (mousePosition.y >= viewport.height-boundedHeight) {
    return {
      index: pointIndex,
      primary: true,
      x: (10 + pointIndex*45) + 20 - offset,
      y: viewport.height - height,
      text: 'Primary Value'
    };
  } else {
    return null;
  }
};
