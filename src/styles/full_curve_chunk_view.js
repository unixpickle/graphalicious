//deps includes.js

function FullCurveChunkView(attrs, chunk, dataSource) {
  EventEmitter.call(this);

  this._attrs = attrs;
  this._chunk = chunk;
  this._dataSource = dataSource;
}

FullCurveChunkView.prototype = Object.create(EventEmitter.prototype);

FullCurveChunkView.prototype.getWidth = function() {
  return this._attrs.computeRegion({
    startIndex: this._chunk.getStartIndex(),
    length: this._chunk.getLength()
  }, this._dataSource.getLength()).width;
};

FullCurveChunkView.prototype.getOffset = function() {
  return this._attrs.computeRegion({
    startIndex: this._chunk.getStartIndex(),
    length: this._chunk.getLength()
  }, this._dataSource.getLength()).left;
};

FullCurveChunkView.prototype.getEncompassingWidth = function() {
  return this._attrs.computeRegion({
    startIndex: 0,
    length: this._dataSource.getLength()
  }, this._dataSource.getLength()).width;
};

FullCurveChunkView.prototype.finishAnimation = function() {
};

FullCurveChunkView.prototype.deletion = function(oldIndex, animate) {
  return false;
};

FullCurveChunkView.prototype.insertion = function(index, animate) {
  return false;
};

FullCurveChunkView.prototype.modification = function(index, animate) {
  return false;
}

FullCurveChunkView.prototype.draw = function(viewport, scrollX, maxValue) {
  if (this._dataSource.getLength() === 0) {
    return {
      left: viewport.x,
      width: 0,
      xmarkers: []
    };
  }

  viewport.context.lineWidth = this._attrs.getLineThickness();
  viewport.context.strokeStyle = this._attrs.getColorScheme().getPrimary();

  // TODO: do something like this:
  //
  // if (pointSpacing > FullCurveChunkView.MIN_SPACING_FOR_SMOOTH) {
  //   this._drawSmooth(startX, pointSpacing, viewport, maxValue);
  // } else {
  //   this._drawStraight(startX, pointSpacing, viewport, maxValue);
  // }

  throw new Error('not yet implemented');
};

FullCurveChunkView.prototype._drawSmooth = function(startX, spacing, viewport, max) {
  var connectPoints = [];
  for (var i = 0, len = this._chunk.getLength(); i < len; ++i) {
    var dataPoint = this._chunk.getDataPoint(i);
    var x = startX + i*spacing;

    var primaryRatio = dataPoint.primary / max;
    var y = viewport.y + (1-primaryRatio)*viewport.height;

    connectPoints.push({x: x, y: y});
  }

  var smoothPoints = smoothPath(connectPoints, 1);
  var ctx = viewport.context;
  ctx.beginPath();
  for (var i = 0, len = smoothPoints.length; i < len; ++i) {
    var point = smoothPoints[i];
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.strokePath();
  ctx.closePath();
};

FullCurveChunkView.prototype._drawStraight = function(startX, spacing, viewport, max) {

};
