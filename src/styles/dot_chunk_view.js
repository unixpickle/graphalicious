//deps bar_chunk_view.js

function DotChunkView(attrs, chunk, dataSource) {
  BarChunkView.call(this, attrs, chunk, dataSource);
}

DotChunkView.prototype = Object.create(BarChunkView.prototype);

DotChunkView.prototype._fillBar = function(ctx, x, y, width, height) {
  ctx.beginPath();
  ctx.arc(x, y, this._attrs.getBarWidth(), 0, 2*Math.PI, false);
  ctx.fill();
};
