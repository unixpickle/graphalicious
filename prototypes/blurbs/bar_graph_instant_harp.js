function BarGraphInstantHarp() {
  BarGraph.call(this);
}

BarGraphInstantHarp.prototype = Object.create(BarGraph.prototype);
BarGraphInstantHarp.prototype.constructor = BarGraphInstantHarp;

BarGraphInstantHarp.prototype.draw = function() {
  BarGraph.prototype.draw.call(this);
  var current = this._currentBar();
  if (current === null) {
    return;
  }
  var blurb = new Blurb();
  blurb.point = current;
  blurb.text = current.text;
  blurb.side = (current.x >= this._viewportSize().width/2 ? Blurb.LEFT : Blurb.RIGHT);
  console.log(blurb);
  blurb.draw();
};

BarGraphInstantHarp.prototype._currentBar = function() {
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
      x: (10 + pointIndex*45) + 20 - offset,
      y: viewport.height - secondaryHeight,
      text: 'Secondary Value'
    };
  } else {
    return {
      x: (10 + pointIndex*45) + 20 - offset,
      y: viewport.height - height,
      text: 'Primary Value'
    };
  }
};
