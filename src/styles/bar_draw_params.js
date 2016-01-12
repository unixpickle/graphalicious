// BarDrawParams stores draw()-specific information about
// how the BarChunkView should be rendered in a canvas.
//
// The attrs object must contain the following attributes:
// - drawOffset: a number indicating the number of pixels, in landscape
//   coordinates, to shift the complete landscape to the right.
//   If this is 0, then the ChunkView will be drawn as if the complete
//   landscape started at 0 in canvas coordinates.
//   This should account for viewport.x and scrollX.
// - viewport: the viewport object passed to the draw() function.
// - landscape: the current MorphingBarLandscape.
// - range: the range of points that are both visible in the viewport
//   contained within the relevant chunk.
// - maxValue: the maxValue argument passed to the draw() function.
// - stretchFactor: right before points are drawn into the viewport,
//   they will be translated using (pointX-viewportX)*stretchFactor + viewportX.
//
// This will deep-copy its arguments.
function BarDrawParams(attrs) {
  this._drawOffset = attrs.drawOffset;
  this._viewport = {
    x: attrs.viewport.x,
    y: attrs.viewport.y,
    width: attrs.viewport.width,
    height: attrs.viewport.height,
    fullX: attrs.viewport.fullX,
    fullY: attrs.viewport.fullY,
    fullWidth: attrs.viewport.fullWidth,
    fullHeight: attrs.viewport.fullHeight,
    context: attrs.viewport.context
  };

  this._landscape = attrs.landscape.copy();
  this._range = {
    startIndex: attrs.range.startIndex,
    length: attrs.range.length
  };
  this._maxValue = attrs.maxValue;
  this._stretchFactor = attrs.stretchFactor;

  assert('number' === typeof this._stretchFactor);
  assert('number' === typeof this._maxValue);
  assert('number' === typeof this._drawOffset);
}

BarDrawParams.prototype.getViewport = function() {
  return this._viewport;
};

BarDrawParams.prototype.getRange = function() {
  return this._range;
};

BarDrawParams.prototype.getLandscape = function() {
  return this._landscape;
};

BarDrawParams.prototype.getMaxValue = function() {
  return this._maxValue;
};

BarDrawParams.prototype.getStretchFactor = function() {
  return this._stretchFactor;
};

BarDrawParams.prototype.clipViewport = function() {
  var vp = this._viewport;
  vp.context.save();
  vp.context.beginPath();
  vp.context.rect(vp.x, vp.y, vp.width, vp.height);
  vp.context.clip();
};

BarDrawParams.prototype.unclipViewport = function() {
  this._viewport.context.restore();
};

BarDrawParams.prototype.landscapeXToCanvasX = function(x) {
  return (x+this._drawOffset-this._viewport.x)*this._stretchFactor + this._viewport.x;
};

BarDrawParams.prototype.canvasXToLandscapeX = function(x) {
  return (x-this._viewport.x)/this._stretchFactor + this._viewport.x - this._drawOffset;
};

BarDrawParams.prototype.landscapeWidthToCanvasWidth = function(w) {
  return w * this._stretchFactor;
};

BarDrawParams.prototype.canvasWidthToLandscapeWidth = function(w) {
  return w / this._stretchFactor;
};

BarDrawParams.prototype.canvasRegionToRegion = function(r) {
  var newLeft = this.canvasXToLandscapeX(r.left);
  var newRight = this.canvasXToLandscapeX(r.left + r.width);
  return {
    left: newLeft,
    width: newRight - newLeft
  };
};

BarDrawParams.prototype.regionToCanvasRegion = function(r) {
  var newLeft = this.landscapeXToCanvasX(r.left);
  var newRight = this.landscapeXToCanvasX(r.left + r.width);
  return {
    left: newLeft,
    width: newRight - newLeft
  };
};
