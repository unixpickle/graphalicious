//deps bar_chunk_view.js

function DotChunkView(attrs, chunk, dataSource) {
  BarChunkView.call(this, attrs, chunk, dataSource);
}

DotChunkView.prototype = Object.create(BarChunkView.prototype);

DotChunkView.prototype._fillBar = function(ctx, x, y, width, height) {
  var radius = this._attrs.getBarWidth() / 2;
  if (radius > height) {
    y = y + height - radius;
  }
  
  ctx.beginPath();
  ctx.arc(x+radius, y, radius, 0, 2*Math.PI, false);
  ctx.fill();
};
