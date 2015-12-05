//deps bar_chunk_view.js

function DotChunkView(dotAttrs, attrs, chunk, dataSource) {
  BarChunkView.call(this, attrs, chunk, dataSource);
  this._dotAttrs = dotAttrs;
}

DotChunkView.prototype = Object.create(BarChunkView.prototype);

DotChunkView.prototype._drawValue = function(params) {
  var radius = this._radiusForDot(params);
  var y = params.y;
  if (this._dotAttrs.getBottomMargin() > params.height) {
    y = y + params.height - this._dotAttrs.getBottomMargin();
  }

  var centerX = params.x + params.width/2;
  if (params.pointIndex === 0) {
    centerX = params.x + radius;
  } else if (params.pointIndex === this._morphingEncompassingCount() - 1) {
    centerX = params.x + params.width - radius;
  }

  var ctx = params.ctx;
  var oldAlpha = ctx.globalAlpha;
  ctx.globalAlpha *= this._opacityForDot(params);
  if (this._dotAttrs.getDotStrokeWidth() > 0) {
    var thickness = this._dotAttrs.getDotStrokeWidth() * (radius / (this._attrs.getBarWidth() / 2));
    this._drawCircle(params, centerX, y, radius-thickness/2);

    ctx.beginPath();
    ctx.arc(centerX, y, radius, 0, 2*Math.PI, false);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = this._dotAttrs.getDotStrokeColor();
    ctx.stroke();
    ctx.closePath();
  } else {
    this._drawCircle(params, centerX, y, radius);
  }
  ctx.globalAlpha = oldAlpha;
};

DotChunkView.prototype._radiusForDot = function(params) {
  return this._attrs.getBarWidth() / 2;
};

DotChunkView.prototype._opacityForDot = function(params) {
  return 1;
};

DotChunkView.prototype._drawCircle = function(params, x, y, radius) {
  var ctx = params.ctx;

  if (params.properness >= 1) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.closePath();
    return;
  }

  var improperStroke = this._dotAttrs.getImproperDotStrokeWidth();
  var fullHoleSize = Math.max(0, radius-improperStroke);
  var holeSize = fullHoleSize * (1 - params.properness);

  ctx.lineWidth = (radius - holeSize);
  ctx.beginPath();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.arc(x, y, (holeSize+radius)/2, 0, 2*Math.PI, false);
  ctx.stroke();
  ctx.closePath();

  var oldFill = ctx.fillStyle;
  ctx.fillStyle = this._dotAttrs.getImproperDotHoleColor();
  ctx.beginPath();
  ctx.arc(x, y, holeSize, 0, 2*Math.PI, false);
  ctx.fill();
  ctx.closePath();
  ctx.fillStyle = oldFill;
};
