//deps includes.js

function FullCurveChunkView(attrs, chunk, dataSource) {
  EventEmitter.call(this);

  this._attrs = attrs;
  this._chunk = chunk;
  this._dataSource = dataSource;
}

FullCurveChunkView.MIN_SPACING_FOR_SMOOTH = 5;

FullCurveChunkView.prototype = Object.create(EventEmitter.prototype);
FullCurveChunkView.prototype.constructor = FullCurveChunkView;

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
};

FullCurveChunkView.prototype.draw = function(viewport, scrollX, maxValue) {
  if (this._dataSource.getLength() < 2) {
    var res = {
      left: viewport.x,
      width: 0,
      xmarkers: []
    };
    if (this._chunk.getLength() === 1) {
      res.width = viewport.width;
    } else if (this._chunk.getStartIndex() === 1) {
      res.left = viewport.x + viewport.width;
    }
    return res;
  }

  viewport.context.lineWidth = this._attrs.getLineThickness();
  viewport.context.strokeStyle = this._attrs.getColorScheme().getPrimary();

  var totalWidth = Math.max(this.getEncompassingWidth(), viewport.width);
  var availableWidth = totalWidth - this._attrs.totalMargins();
  var pointSpacing = availableWidth / (this._dataSource.getLength() - 1);

  var startX = viewport.x - scrollX + this._chunk.getStartIndex()*pointSpacing +
    this._attrs.getLeftMargin();

  if (pointSpacing > FullCurveChunkView.MIN_SPACING_FOR_SMOOTH) {
    this._drawSmooth(startX, pointSpacing, viewport, maxValue);
  } else {
    this._drawStraight(startX, pointSpacing, viewport, maxValue);
  }

  var markers = [];
  for (var i = 0, len = this._chunk.getLength(); i < len; ++i) {
    var x = startX + pointSpacing*i;
    if (x < viewport.x) {
      continue;
    } else if (x >= viewport.x+viewport.width) {
      break;
    }
    var point = this._chunk.getDataPoint(i);
    var idx = i + this._chunk.getStartIndex();
    markers.push({
      x: x,
      index: idx,
      oldIndex: idx,
      dataPoint: point,
      oldDataPoint: point,
      visibility: 1
    });
  }

  var drawLeft = startX;
  var drawWidth = Math.max(0, (this._chunk.getLength()-1)*pointSpacing);
  if (this._chunk.getStartIndex() === 0) {
    drawLeft -= this._attrs.getLeftMargin();
    drawWidth += this._attrs.getLeftMargin();
  }
  if (this._chunk.getStartIndex()+this._chunk.getLength() === this._dataSource.getLength()) {
    drawWidth += this._attrs.getRightMargin();
  }

  var report = regionIntersection({left: viewport.x, width: viewport.width}, {
    left: drawLeft,
    width: drawWidth
  });
  report.xmarkers = markers;

  return report;
};

FullCurveChunkView.prototype._drawSmooth = function(startX, spacing, viewport, max) {
  var smoothPoints = smoothPath(this._dataPointCoords(startX, spacing, viewport, max), 1);
  this._strokePath(viewport, smoothPoints);
};

FullCurveChunkView.prototype._drawStraight = function(startX, spacing, viewport, max) {
  this._strokePath(viewport, this._dataPointCoords(startX, spacing, viewport, max));
};

FullCurveChunkView.prototype._dataPointCoords = function(startX, spacing, viewport, max) {
  var res = [];

  for (var i = 0, len = this._chunk.getLength(); i < len; ++i) {
    var x = startX + i*spacing;

    if (x+spacing <= viewport.x) {
      continue;
    } else if (x-spacing >= viewport.x+viewport.width) {
      break;
    }

    var dataPoint = this._chunk.getDataPoint(i);
    var primaryRatio = dataPoint.primary / max;
    var y = viewport.y + (1-primaryRatio)*viewport.height;

    res.push({x: x, y: y});
  }

  return res;
};

FullCurveChunkView.prototype._strokePath = function(viewport, coords) {
  var ctx = viewport.context;
  var isFirstPoint = true;

  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (var i = 0, len = coords.length; i < len; ++i) {
    var coord = coords[i];
    if (i+1 < len && coords[i+1].x < viewport.x) {
      continue;
    }
    if (isFirstPoint) {
      isFirstPoint = false;
      ctx.moveTo(coord.x, coord.y);
    } else {
      ctx.lineTo(coord.x, coord.y);
    }
    if (coord.x >= viewport.x+viewport.width) {
      break;
    }
  }

  ctx.stroke();
  ctx.closePath();
};
