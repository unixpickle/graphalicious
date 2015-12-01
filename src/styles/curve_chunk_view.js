//deps dot_chunk_view.js

function CurveChunkView(attrs, chunk, dataSource) {
  DotChunkView.call(this, attrs, chunk, dataSource);
}

CurveChunkView.prototype = Object.create(DotChunkView.prototype);

CurveChunkView.prototype._drawRange = function(drawOffset, landscape, range, viewport, maxValue) {
  this._drawPrimaryPath(drawOffset, landscape, range, viewport, maxValue);

  // TODO: do our own thing here to position the morphing point in a fancy way.
  return DotChunkView.prototype._drawRange.call(this, drawOffset, landscape, range, viewport,
    maxValue);
};

CurveChunkView.prototype._drawPrimaryPath = function(drawOffset, landscape, range, viewport,
                                                     maxValue) {
  var startIndex = range.startIndex;
  var length = range.length;

  var pointCount = this._morphingPointCount();
  if (startIndex > this._startIndex) {
    --startIndex;
    ++length;
  }
  if (startIndex+length < this._startIndex+pointCount) {
    ++length;
  }

  // TODO: account for animation-specific information here.

  var points = [];
  for (var i = startIndex, end = startIndex+length; i < end; ++i) {
    var dataPoint = this._morphingGetPoint(i - this._startIndex);
    var height = viewport.height * (dataPoint.primary / maxValue);
    var y = viewport.y + viewport.height - height;

    var coords = landscape.computeBarRegion(i);
    points.push({x: drawOffset + coords.left + coords.width/2, y: y});
  }

  var linePoints = smoothPath(points, 1);

  var ctx = viewport.context;
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = this._attrs.getColorScheme().getPrimary();
  ctx.moveTo(linePoints[0].x, linePoints[0].y);
  for (var i = 1, len = linePoints.length; i < len; ++i) {
    ctx.lineTo(linePoints[i].x, linePoints[i].y);
  }
  ctx.stroke();
  ctx.closePath();
};
