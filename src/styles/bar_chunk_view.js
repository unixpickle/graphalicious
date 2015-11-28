//deps includes.js

function BarChunkView(attrs, chunk, dataSource) {
  EventEmitter.call(this);

  this._attrs = attrs;
  this._chunk = chunk;

  this._encompassingCount = dataSource.getLength();
  this._dataPoints = [];
  this._startIndex = chunk.getStartIndex();
  for (var i = 0, len = chunk.getLength(); i < len; ++i) {
    this._dataPoints.push(chunk.getDataPoint(i));
  }

  this._animationFrame = null;
  this._animationProgress = 0;
  this._animationStartTime = -1;
  this._animationType = BarChunkView.ANIMATION_NONE;
  this._animationDataPoint = null;
  this._animationPointIndex = 0;
  this._animationInitialStartIndex = 0;
  this._animationInitialCount = 0;
}

BarChunkView.ANIMATION_NONE = 0;
BarChunkView.ANIMATION_DELETE = 1;
BarChunkView.ANIMATION_INSERT = 2;
BarChunkView.ANIMATION_MODIFY = 3;

BarChunkView.ANIMATION_DURATION = 300;

BarChunkView.prototype = Object.create(EventEmitter.prototype);

BarChunkView.prototype.getWidth = function() {
  var landscape = this._morphingLandscape();
  var range = {
    startIndex: this._startIndex,
    length: this._morphingPointCount
  };
  return landscape.computeRegion(range).width;
};

BarChunkView.prototype.getOffset = function() {
  return this._morphingLandscape().computeRegion({startIndex: this._startIndex, length: 1}).left;
};

BarChunkView.prototype.getEncompassingWidth = function() {
  return this._morphingLandscape().width();
};

BarChunkView.prototype.deletion = function(oldIndex, animate) {
  assert(this._encompassingCount > 0);
  assert(oldIndex < this._encompassingCount);
  --this._encompassingCount;

  this.finishAnimation();
  if (animate && this._attrs.getAnimateDeletions() &&
      this._chunk.getLength() !== this._dataPoints.length &&
      this._dataPoints.length !== 1) {
    this._startAnimation(oldIndex, BarChunkView.ANIMATION_DELETE,
      this._dataPoints[oldIndex - this._startIndex]);
  }

  if (oldIndex < this._startIndex) {
    --this._startIndex;
  } else if (oldIndex < this._startIndex+this._dataPoints.length) {
    this._dataPoints.splice(oldIndex-this._startIndex, 1);
  }

  return this._animationType !== BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.insertion = function(index, animate) {
  ++this._encompassingCount;
  assert(index <= this._encompassingCount);

  this.finishAnimation();
  if (this._chunk.getLength() > this._dataPoints.length) {
    var point = this._chunk.getDataPoint(index - this._startIndex);

    if (animate && this._attrs.getAnimateInsertions() && this._dataPoints.length !== 0) {
      this._startAnimation(index, BarChunkView.ANIMATION_INSERT, point);
    }

    this._dataPoints.splice(index-this._startIndex, 0, point);
  } else if (index < this._startIndex) {
    ++this._startIndex;
  }

  return this._animationType !== BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.modification = function(index, animate) {
  assert(this._encompassingCount > 0);
  assert(index < this._encompassingCount);

  if (index < this._startIndex || index >= this._startIndex+this._dataPoints.length) {
    return false;
  }

  this.finishAnimation();
  if (animate && this._attrs.getAnimateModifications()) {
    this._startAnimation(index, BarChunkView.ANIMATION_MODIFY,
      this._dataPoints[index - this._startIndex]);
  }

  var point = this._chunk.getDataPoint(index - this._startIndex);
  this._dataPoints[index - this._startIndex] = point;

  return this._animationType !== BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.finishAnimation = function() {
  if (this._animationFrame !== null) {
    window.cancelAnimationFrame(this._animationFrame);
    this._animationFrame = null;
    this._animationType = BarChunkView.ANIMATION_NONE;
  }
};

BarChunkView.prototype.draw = function(viewport, scrollX, maxValue) {
  var totalCount = this._morphingEncompassingCount();
  var pointCount = this._morphingPointCount();

  var landscape = this._morphingLandscape();
  var range = landscape.computeRange({left: scrollX, width: viewport.width});

  assert(range.length <= totalCount && range.startIndex < totalCount);
  assert(range.length > 0 || range.startIndex === 0);

  if (range.length === totalCount) {
    assert(range.startIndex === 0);
    return this._drawStretched(landscape, viewport, maxValue);
  }

  // NOTE: if the content is offscreen besides some whitespace an edge, include the data point for
  // that edge.
  if (range.startIndex + range.length <= this._startIndex) {
    range = {startIndex: this._startIndex, length: 1};
  } else if (range.startIndex >= this._startIndex+pointCount) {
    range = {startIndex: this._startIndex+pointCount-1, length: 1};
  }

  range = rangeIntersection(range, {startIndex: this._startIndex, length: pointCount});
  if (range.length === 0) {
    return {left: viewport.x, width: 0, xmarkers: []}
  }

  var drawOffset = viewport.x - scrollX;
  var xmarkers = this._drawRange(drawOffset, landscape, range, viewport, maxValue);

  var region = landscape.computeRegion(range);
  region.left += drawOffset;
  if (region.left < viewport.x) {
    region.width -= viewport.x - region.left;
    region.left = viewport.x;
  }
  if (region.left + region.width > viewport.x + viewport.width) {
    region.width = viewport.x + viewport.width - region.left;
  }
  region.xmarkers = xmarkers;

  if (region.width < 0) {
    region.width = 0;
  }

  return region;
};

BarChunkView.prototype._drawStretched = function(landscape, viewport, maxValue) {
  var range = {startIndex: this._startIndex, length: this._morphingPointCount()};
  var stretchMode = this._attrs.getStretchMode();

  if (stretchMode === BarStyleAttrs.STRETCH_MODE_ELONGATE) {
    var regularWidth = landscape.width();
    var stretchFactor = viewport.width / regularWidth;
    viewport.context.save();
    viewport.context.translate(viewport.x);
    viewport.context.scale(stretchFactor, 1);
    var markers = this._drawRange(0, landscape, range, viewport, maxValue);
    viewport.context.restore();

    for (var i = 0, len = markers.length; i < len; ++i) {
      var marker = markers[i];
      marker.x *= stretchFactor;
      marker.x += viewport.x;
    }

    var result = landscape.computeRegion(range);
    result.xmarkers = markers;
    result.width *= stretchFactor;
    result.left *= stretchFactor;
    result.left += viewport.x;
    return result;
  }

  var left = viewport.x;
  if (stretchMode === BarStyleAttrs.STRETCH_MODE_JUSTIFY_CENTER) {
    left += (viewport.width - landscape.width()) / 2;
  } else if (stretchMode === BarStyleAttrs.STRETCH_MODE_JUSTIFY_RIGHT) {
    left += viewport.width - landscape.width();
  }

  var markers = this._drawRange(left, landscape, range, viewport, maxValue);
  var region = landscape.computeRegion(range);
  return {
    left: region.left + left,
    width: region.width,
    xmarkers: markers
  };
};

BarChunkView.prototype._drawRange = function(drawOffset, landscape, range, viewport, maxValue) {
  var pointCount = this._morphingPointCount();

  var colorScheme = this._attrs.getColorScheme();
  var colors = [colorScheme.getPrimary(), colorScheme.getSecondary()];
  var ctx = viewport.context;
  var xmarkers = [];

  for (var i = range.startIndex, end = range.startIndex+range.length; i < end; ++i) {
    assert(i >= this._startIndex && i < this._startIndex + pointCount);

    var dataPoint = this._morphingGetPoint(i - this._startIndex);
    var values = [dataPoint.primary];
    if (dataPoint.secondary) {
      values.push(dataPoint.secondary);
    }

    var coords = landscape.computeBarRegion(i);
    coords.left += drawOffset;

    var xmarker = this._computeXMarker(landscape, drawOffset, i);
    xmarkers.push(xmarker);

    for (var j = 0, len = values.length; j < len; ++j) {
      var val = values[j];
      var height = viewport.height * (val / maxValue);
      var y = viewport.y + viewport.height - height;
      ctx.fillStyle = colors[j];
      ctx.fillRect(coords.left, y, coords.width, height);
    }
  }

  return xmarkers;
};

// _computeXMarker generates an XMarker object for a bar being drawn by _drawRange.
BarChunkView.prototype._computeXMarker = function(landscape, drawOffset, idx) {
  assert(idx >= this._startIndex && i < this._startIndex + this._morphingPointCount());

  var result = this._computeXMarkerData(idx);

  var barCoords = landscape.computeBarRegion(idx);
  var barRegion = landscape.computeRegion({startIndex: idx, length: 1});
  switch (this._attrs.getXLabelAlignment()) {
  case BarStyleAttrs.X_LABELS_CENTER:
    result.x = barCoords.left + barCoords.width/2;
    break;
  case BarStyleAttrs.X_LABELS_RIGHT:
    result.x = (barCoords.left + barCoords.width + barRegion.left + barRegion.width) / 2;
    break;
  case BarStyleAttrs.X_LABELS_LEFT:
    result.x = (barCoords.left + barRegion.left) / 2;
    break;
  default:
    throw new Error('unknown x-label alignment:' + this._attrs.getXLabelAlignment());
    break;
  }
  result.x += drawOffset;

  return result;
};

// _computeXMarkerData generates an XMarker object without the x field.
// The supplied index should be absolute, not chunk-relative.
BarChunkView.prototype._computeXMarkerData = function(idx) {
  var result = {
    visibility: 1,
    index: idx,
    oldIndex: idx
  };

  switch (this._animationType) {
  case BarChunkView.ANIMATION_DELETE:
    if (idx < this._animationPointIndex) {
      result.dataPoint = this._dataPoints[idx - this._startIndex];
      result.oldDataPoint = result.dataPoint;
    } else if (idx === this._animationPointIndex) {
      result.index = -1;
      result.oldIndex = this._animationPointIndex;
      result.dataPoint = null;
      result.oldDataPoint = this._animationDataPoint;
      result.visibility = 1 - this._animationProgress;
    } else {
      --result.index;
      result.dataPoint = this._dataPoints[idx - 1 - this._startIndex];
      result.oldDataPoint = result.dataPoint;
    }
    break;
  case BarChunkView.ANIMATION_MODIFY:
    var newPoint = this._dataPoints[idx - this._startIndex];
    result.dataPoint = newPoint;
    if (idx !== this._animationPointIndex) {
      result.oldDataPoint = newPoint;
    } else {
      result.oldDataPoint = this._animationDataPoint;
    }
    break;
  case BarChunkView.ANIMATION_INSERT:
    result.dataPoint = this._dataPoints[idx - this._startIndex];
    if (idx === this._animationPointIndex) {
      result.oldDataPoint = null;
      result.oldIndex = -1;
      result.visibility = this._animationProgress;
    } else {
      result.oldDataPoint = result.dataPoint;
    }
    if (idx > this._animationPointIndex) {
      --result.oldIndex;
    }
    break;
  case BarChunkView.ANIMATION_NONE:
    result.dataPoint = this._dataPoints[idx - this._startIndex];
    result.oldDataPoint = result.dataPoint;
    break;
  }

  return result;
};

BarChunkView.prototype._animate = function(time) {
  if (this._animationStartTime < 0) {
    this._animationStartTime = time;
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
    return;
  }

  var elapsed = (time - this._animationStartTime) / BarChunkView.ANIMATION_DURATION;
  if (elapsed >= 1) {
    elapsed = 1;
  }
  this._animationProgress = elapsed;
  if (elapsed === 1) {
    this.finishAnimation();
    this.emit('animationFrame', 1);
    this.emit('animationEnd');
  } else {
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
    this.emit('animationFrame', elapsed);
  }
};

BarChunkView.prototype._startAnimation = function(index, type, point) {
  this._animationInitialStartIndex = this._startIndex;
  this._animationInitialCount = this._dataPoints.length;
  this._animationPointIndex = index;
  this._animationDataPoint = point;
  this._animationProgress = 0;
  this._animationStartTime = -1;
  this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  this._animationType = type;
};

BarChunkView.prototype._morphingLandscape = function() {
  var properties = {
    attrs: this._attrs,
    pointCount: this._morphingEncompassingCount(),
    morphingIndex: 0,
    morphingVisibility: 1
  };

  if (this._animationType === BarChunkView.ANIMATION_DELETE ||
      this._animationType === BarChunkView.ANIMATION_INSERT) {
    properties.morphingIndex = this._animationPointIndex;
    if (this._animationType === BarChunkView.ANIMATION_INSERT) {
      properties.morphingVisibility = this._animationProgress;
    } else {
      properties.morphingVisibility = 1 - this._animationProgress;
    }
  }

  return new MorphingBarLandscape(properties);
};

// _morphingPointCount returns the number of points in this ChunkView's partial morphing landscape.
BarChunkView.prototype._morphingPointCount = function() {
  if (this._animationType === BarChunkView.ANIMATION_DELETE) {
    return this._dataPoints.length + 1;
  } else {
    return this._dataPoints.length;
  }
};

// _morphingEncompassingCount returns the number of data points in the complete morphing landscape.
BarChunkView.prototype._morphingEncompassingCount = function() {
  if (this._animationType === BarChunkView.ANIMATION_DELETE) {
    return this._encompassingCount + 1;
  } else {
    return this._encompassingCount;
  };
};

// _morphingGetPoint returns the data point at a chunk-relative index in the partial morphing
// landscape.
// This will handle deleted points and modified points in a special way.
BarChunkView.prototype._morphingGetPoint = function(idx) {
  assert(idx >= 0);
  assert(idx < this._morphingPointCount());
  if (this._animationType === BarChunkView.ANIMATION_DELETE) {
    if (idx + this._startIndex < this._animationPointIndex) {
      return this._dataPoints[idx];
    } else if (idx + this._startIndex === this._animationPointIndex) {
      return this._animationDataPoint;
    } else {
      return this._dataPoints[idx - 1];
    }
  } else if (this._animationType === BarChunkView.ANIMATION_MODIFY) {
    var newPoint = this._dataPoints[idx];
    if (idx + this._startIndex !== this._animationPointIndex) {
      return newPoint;
    }
    var oldPoint = this._animationDataPoint;

    var p = this._animationProgress;
    var np = 1 - this._animationProgress;

    var intermediatePoint = {
      primary: p*newPoint.primary + np*oldPoint.primary,
      secondary: -1
    };

    if (newPoint.secondary < 0 && oldPoint.secondary >= 0) {
      intermediatePoint.secondary = np * oldPoint.secondary;
    } else if (newPoint.secondary >= 0 && oldPoint.secondary < 0) {
      intermediatePoint.secondary = p * newPoint.secondary;
    } else {
      intermediatePoint.secondary = p*newPoint.secondary + np*oldPoint.secondary;
    }

    return intermediatePoint;
  } else {
    return this._dataPoints[idx];
  }
};
