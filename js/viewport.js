(function() {

  // A Viewport defines a clipped region inside a GraphView.
  function Viewport(graphView, x, y, width, height) {
    this._graphView = graphView;
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
  }

  // containedViewport generates a new viewport within this one.
  // The subX and subY coordinates are relative to this viewport's own x and y coordinates.
  Viewport.prototype.containedViewport = function(subX, subY, width, height) {
    return new Viewport(this._graphView, this._x+subX, this._y+subY, width, height);
  };

  // context returns a 2D drawing context for the underlying canvas.
  // You should not draw in this context before calling enter().
  Viewport.prototype.context = function() {
    return this._graphView.context;
  };

  // enter performs transformation and clipping operations on the context to ensure that drawing
  // will behave as expected. This should be called before the viewport's associated view begins
  // drawing.
  //
  // Every call to enter() should be matched with a call to leave().
  Viewport.prototype.enter = function() {
    var context = this.context();
    context.save();
    context.translate(-this._x, -this._y);
    context.beginPath();
    context.rect(0, 0, this._width, this._height);
    context.closePath();
    context.clip();
  };

  // height returns the height of the viewport in CSS pixels.
  Viewport.prototype.height = function() {
    return this._height;
  };

  // leave reverses what was done by enter().
  Viewport.prototype.leave = function() {
    this.context().restore();
  };

  // width returns the width of the viewport in CSS pixels.
  Viewport.prototype.width = function() {
    return this._width;
  };

})();
