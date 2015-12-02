//deps dot_chunk_view.js

function CurveChunkView(attrs, chunk, dataSource) {
  DotChunkView.call(this, attrs, chunk, dataSource);
}

CurveChunkView.prototype = Object.create(DotChunkView.prototype);

CurveChunkView.prototype._drawRange = function(drawOffset, landscape, range, viewport, maxValue) {
  var params = {
    drawOffset: drawOffset,
    landscape: landscape,
    range: range,
    viewport: viewport,
    maxValue: maxValue
  };

  var newMorphingY = this._strokePrimaryPath(range, params);

  // TODO: do our own thing here to position the morphing point with newMorphingY.
  return DotChunkView.prototype._drawRange.call(this, drawOffset, landscape, range, viewport,
    maxValue);
};

CurveChunkView.prototype._strokePrimaryPath = function(range, params) {
  var ctx = params.viewport.context;
  ctx.lineWidth = 3;
  ctx.strokeStyle = this._attrs.getColorScheme().getPrimary();
  var getter = this._morphingSplineGetter.bind(this, true);
  return this._strokePath(range, params, getter);
};

CurveChunkView.prototype._strokePath = function(range, params, getter) {
  var startIndex = range.startIndex;
  var length = range.length;

  if (getter(startIndex - 1) >= 0) {
    --startIndex;
    ++length;
  }

  if (getter(startIndex + length) >= 0) {
    ++length;
  }

  if (this._animationType !== BarChunkView.ANIMATION_NONE) {
    var idx = this._animationPointIndex;
    if (idx === startIndex) {
      if (getter(startIndex - 1) >= 0) {
        --startIndex;
        ++length;
      }
    } else if (idx === startIndex + length - 1) {
      if (getter(startIndex + length) >= 0) {
        ++length;
      }
    }

    var newRange = {startIndex: startIndex, length: length};
    if (idx === startIndex || idx === startIndex+length-1) {
      return this._strokePathEdgeMorphing(newRange, params, getter);
    } else if (idx > startIndex && idx < startIndex+length) {
      return this._strokePathMidMorphing(newRange, params, getter);
    }
  }

  var newRange = {startIndex: startIndex, length: length};
  return this._strokePathNoMorphing(newRange, params, getter);
};

CurveChunkView.prototype._strokePathNoMorphing = function(range, params, getter) {
  var points = this._generatePointsForPath(range, params, getter);
  var linePoints = smoothPath(points, 1);

  var ctx = params.viewport.context;
  ctx.beginPath();
  ctx.moveTo(linePoints[0].x, linePoints[0].y);
  for (var i = 1, len = linePoints.length; i < len; ++i) {
    ctx.lineTo(linePoints[i].x, linePoints[i].y);
  }
  ctx.stroke();
  ctx.closePath();

  return -1;
};

CurveChunkView.prototype._strokePathEdgeMorphing = function(range, params, getter) {
  var points = this._generatePointsForPath(range, params, getter);
  var linePoints = smoothPath(points, 1);

  var ctx = params.viewport.context;
  ctx.beginPath();
  ctx.moveTo(linePoints[0].x, linePoints[0].y);
  for (var i = 1, len = linePoints.length; i < len; ++i) {
    ctx.lineTo(linePoints[i].x, linePoints[i].y);
  }
  ctx.stroke();
  ctx.closePath();

  return -1;
};

CurveChunkView.prototype._strokePathMidMorphing = function(range, params, getter) {
  var points = this._generatePointsForPath(range, params, getter);
  var linePoints = smoothPath(points, 1);

  var ctx = params.viewport.context;
  ctx.beginPath();
  ctx.moveTo(linePoints[0].x, linePoints[0].y);
  for (var i = 1, len = linePoints.length; i < len; ++i) {
    ctx.lineTo(linePoints[i].x, linePoints[i].y);
  }
  ctx.stroke();
  ctx.closePath();

  return -1;
};

// _generatePointsForPath generates point objects for every value in a range, given drawing params.
CurveChunkView.prototype._generatePointsForPath = function(range, params, getter) {
  var points = [];
  for (var i = range.startIndex, end = range.startIndex+range.length; i < end; ++i) {
    var height = params.viewport.height * (getter(i) / params.maxValue);
    var y = params.viewport.y + params.viewport.height - height;

    var coords = params.landscape.computeBarRegion(i);
    var x = params.drawOffset + coords.left + coords.width/2;
    if (i === 0) {
      x = params.drawOffset + coords.left + this._attrs.getBarWidth()/2;
    } else if (i === this._morphingEncompassingCount() - 1) {
      x = params.drawOffset + coords.left + coords.width - this._attrs.getBarWidth()/2;
    }
    points.push({x: x, y: y});
  }
  return points;
};

// _morphingSplineGetter gets the primary or secondary value of the point at the given absolute
// index.
// If the index is outside of the chunk or if the secondary value is not available, this returns -1.
CurveChunkView.prototype._morphingSplineGetter = function(primary, index) {
  var pointCount = this._morphingPointCount();
  if (index < this._startIndex || index >= this._startIndex+pointCount) {
    return -1;
  }
  var point = this._morphingGetPoint(index - this._startIndex);
  if (primary) {
    return point.primary;
  } else {
    return point.secondary;
  }
};
