//deps dot_chunk_view.js

function CurveChunkView(attrs, chunk, dataSource) {
  DotChunkView.call(this, attrs, chunk, dataSource);

  this._newMorphingPrimaryY = -1;
  this._newMorphingSecondaryY = -1;
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

  this._newMorphingPrimaryY = this._strokePrimaryPath(range, params);

  return DotChunkView.prototype._drawRange.call(this, drawOffset, landscape, range, viewport,
    maxValue);
};

CurveChunkView.prototype._fillBar = function(ctx, x, y, width, height, pointIdx, primary) {
  if (primary && this._newMorphingPrimaryY >= 0 && pointIdx === this._animationPointIndex) {
    DotChunkView.prototype._fillBar.call(this, ctx, x, this._newMorphingPrimaryY, width, height,
      pointIdx, primary);
  } else {
    DotChunkView.prototype._fillBar.call(this, ctx, x, y, width, height, pointIdx, primary);
  }
};

CurveChunkView.prototype._radiusForDot = function(x, y, width, height, pointIdx, primary) {
  var superValue = DotChunkView.prototype._radiusForDot.call(this, x, y, width, height, pointIdx,
    primary);
  if (pointIdx === this._animationPointIndex && this._newMorphingPrimaryY >= 0) {
    if (this._animationType === BarChunkView.ANIMATION_INSERT) {
      return this._animationProgress * superValue;
    } else {
      return (1 - this._animationProgress) * superValue;
    }
  }
  return superValue;
};

DotChunkView.prototype._opacityForDot = function(x, y, width, height, pointIndex, primary) {
  if (this._animationType === BarChunkView.ANIMATION_DELETE &&
      pointIndex === this._animationPointIndex) {
    return 1 - this._animationProgress;
  } else {
    return 1;
  }
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

  if (this._animationType === BarChunkView.ANIMATION_INSERT ||
      this._animationType === BarChunkView.ANIMATION_DELETE) {
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
  if (this._animationType === BarChunkView.ANIMATION_INSERT) {
    // NOTE: this is the effect affectionately known as "spiderman".
    this._strokePathNoMorphing(range, params, getter);
    return;
  }

  var showingPoints = this._generatePointsForPath(range, params, getter);
  var showingPath = smoothPath(showingPoints, 1);

  var hiddenPoints = showingPoints.slice();
  hiddenPoints.splice(this._animationPointIndex - range.startIndex, 1);
  var hiddenPath = smoothPath(hiddenPoints, 1);

  // NOTE: the showing region necessarily overlaps with the hidden region.
  assert(showingPath[showingPath.length-1].x >= hiddenPath[0].x);

  var amountShowing = 1 - this._animationProgress;
  var ctx = params.viewport.context;

  // NOTE: as we draw the overlapping part, keep in mind that the hidden x values and showing x
  // values might be a tad misaligned, but it's okay, I promise.
  var startShowingIdx = 0;
  while (showingPath[startShowingIdx].x < hiddenPath[0].x) {
    ++startShowingIdx;
  }
  var overlapCount = Math.min(hiddenPath.length, showingPath.length-startShowingIdx);
  ctx.beginPath();
  for (var i = 0; i < overlapCount; ++i) {
    var showingY = showingPath[startShowingIdx + i].y;
    var hiddenY = hiddenPath[i].y;
    var x = hiddenPath[i].x;
    var y = amountShowing*showingY + (1-amountShowing)*hiddenY;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.closePath();

  var oldAlpha = ctx.globalAlpha;
  ctx.globalAlpha *= amountShowing;
  ctx.beginPath();
  if (range.startIndex === this._animationPointIndex) {
    ctx.moveTo(showingPath[0].x, showingPath[0].y);
    for (var i = 1, len = showingPath.length-hiddenPath.length; i < len; ++i) {
      ctx.lineTo(showingPath[i].x, showingPath[i].y);
    }
  } else {
    var start = hiddenPath.length;
    ctx.moveTo(showingPath[start].x, showingPath[start].y);
    for (var i = 1, len = showingPath.length-hiddenPath.length; i < len; ++i) {
      ctx.lineTo(showingPath[start+i].x, showingPath[start+i].y);
    }
  }
  ctx.stroke();
  ctx.closePath();
  ctx.globalAlpha = oldAlpha;

  return -1;
};

CurveChunkView.prototype._strokePathMidMorphing = function(range, params, getter) {
  var showingPoints = this._generatePointsForPath(range, params, getter);
  var hiddenPoints = showingPoints.slice();
  var removedPoint = hiddenPoints[this._animationPointIndex - range.startIndex];
  hiddenPoints.splice(this._animationPointIndex-range.startIndex, 1);

  var showingPath = smoothPath(showingPoints, 1);
  var hiddenPath = smoothPath(hiddenPoints, 1);

  assert(showingPath[0].x === hiddenPath[0].x);
  assert(showingPath.length === hiddenPath.length);

  var amountShowing;
  if (this._animationType === BarChunkView.ANIMATION_INSERT) {
    amountShowing = this._animationProgress;
  } else {
    amountShowing = 1 - this._animationProgress;
  }

  var ctx = params.viewport.context;
  var resultY = 0;
  ctx.beginPath();
  ctx.moveTo(showingPath[0].x, (1-amountShowing)*hiddenPath[0].y+amountShowing*showingPath[0].y);
  for (var i = 1, len = showingPath.length; i < len; ++i) {
    var y = (1-amountShowing)*hiddenPath[i].y + amountShowing*showingPath[i].y;
    ctx.lineTo(showingPath[i].x, y);
    if (showingPath[i].x <= removedPoint.x) {
      resultY = y;
    }
  }
  ctx.stroke();
  ctx.closePath();

  return resultY;
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
