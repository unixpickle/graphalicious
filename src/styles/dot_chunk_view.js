//deps bar_chunk_view.js

function DotChunkView(dotAttrs, attrs, chunk, dataSource) {
  BarChunkView.call(this, attrs, chunk, dataSource);
  this._dotAttrs = dotAttrs;
}

// DotChunkView.HOVER_NEAR_RADIUS is the maximum distance a user can be from a dot before
// it registers as a hover event.
DotChunkView.HOVER_NEAR_RADIUS = 20;

DotChunkView.prototype = Object.create(BarChunkView.prototype);
DotChunkView.prototype.constructor = DotChunkView;

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

DotChunkView.prototype._computeHoverInformation = function(pointerPos, viewport, maxValue) {
  var landscape = this._morphingLandscape();
  var maxRadius = DotChunkView.HOVER_NEAR_RADIUS + this._attrs.getBarWidth()/2;
  var range = landscape.computeRange({left: pointerPos.x-maxRadius, width: maxRadius*2});

  var closestDistance = maxRadius;
  var closestResult = null;

  for (var i = range.startIndex-1; i <= range.startIndex+range.length; ++i) {
    var points = this._hoverInfosForPointIndex(i, viewport, maxValue, landscape);
    for (var j = 0, len = points.length; j < len; ++j) {
      var point = points[j];
      var dist = Math.sqrt(Math.pow(point.position.x-pointerPos.x, 2) +
        Math.pow(point.position.y-pointerPos.y, 2));
      if (dist <= closestDistance) {
        closestDistance = dist;
        closestResult = point;
      }
    }
  }

  return closestResult;
};

DotChunkView.prototype._hoverInfosForPointIndex = function(index, viewport, maxValue, landscape) {
  if (index < this._startIndex || index >= this._startIndex+this._morphingPointCount()) {
    return [];
  }

  var point = this._morphingGetPoint(index - this._startIndex);
  var region = landscape.computeBarRegion(index);
  var radius = this._attrs.getBarWidth() / 2;

  var res = [];
  for (var i = 0; i < 2; ++i) {
    if ((i === 0 && !point.hasOwnProperty('primaryTooltip')) ||
        (i === 1 && (point.secondary < 0 || !point.hasOwnProperty('secondaryTooltip')))) {
      continue;
    }

    var value = (i === 0 ? point.primary : point.secondary);
    var text = (i === 0 ? point.primaryTooltip : point.secondaryTooltip);

    var height = (value / maxValue) * viewport.height;
    var y = viewport.y + viewport.height - height;
    if (this._dotAttrs.getBottomMargin() > height) {
      y += height - this._dotAttrs.getBottomMargin();
    }

    var centerX = region.left + region.width/2;
    if (index === 0) {
      centerX = region.left + radius;
    } else if (index === this._morphingEncompassingCount()-1) {
      centerX = region.left + region.width - radius;
    }

    res.push({
      position: {x: centerX, y: y},
      text: text
    });
  }

  return res;
};
