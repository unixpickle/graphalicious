//deps bar_chunk_view.js

function DotChunkView(attrs, chunk, dataSource) {
  BarChunkView.call(this, attrs, chunk, dataSource);
}

DotChunkView.prototype = Object.create(BarChunkView.prototype);

DotChunkView.prototype._fillBar = function(ctx, x, y, width, height, pointIdx) {
  var radius = this._attrs.getBarWidth() / 2;
  if (radius > height) {
    y = y + height - radius;
  }

  var centerX = x + width/2;
  if (pointIdx === 0) {
    centerX = x + radius;
  } else if (pointIdx === this._morphingEncompassingCount() - 1) {
    centerX = x + width - radius;
  }

  ctx.beginPath();
  ctx.arc(centerX, y, radius, 0, 2*Math.PI, false);
  ctx.fill();
};
