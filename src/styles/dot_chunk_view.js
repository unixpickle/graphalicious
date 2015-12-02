//deps bar_chunk_view.js

function DotChunkView(attrs, chunk, dataSource) {
  BarChunkView.call(this, attrs, chunk, dataSource);
}

DotChunkView.prototype = Object.create(BarChunkView.prototype);

DotChunkView.prototype._fillBar = function(ctx, x, y, width, height, pointIdx, primary) {
  var radius = this._radiusForDot(x, y, width, height, pointIdx, primary);
  if (radius > height) {
    y = y + height - radius;
  }

  var centerX = x + width/2;
  if (pointIdx === 0) {
    centerX = x + radius;
  } else if (pointIdx === this._morphingEncompassingCount() - 1) {
    centerX = x + width - radius;
  }

  var oldAlpha = ctx.globalAlpha;
  ctx.globalAlpha *= this._opacityForDot(x, y, width, height, pointIdx, primary);
  ctx.beginPath();
  ctx.arc(centerX, y, radius, 0, 2*Math.PI, false);
  ctx.fill();
  ctx.closePath();
  ctx.globalAlpha = oldAlpha;
};

DotChunkView.prototype._radiusForDot = function(x, y, width, height, pointIdx, primary) {
  return this._attrs.getBarWidth() / 2;
};

DotChunkView.prototype._opacityForDot = function(x, y, width, height, pointIndex, primary) {
  return 1;
};
