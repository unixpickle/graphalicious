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

  this._pointerPosition = null;
  this._blurbManager = new BlurbManager(attrs);
  this._registerBlurbManagerEvents();
}

BarChunkView.ANIMATION_NONE = 0;
BarChunkView.ANIMATION_DELETE = 1;
BarChunkView.ANIMATION_INSERT = 2;
BarChunkView.ANIMATION_MODIFY = 3;

BarChunkView.ANIMATION_DURATION = 300;

// BarChunkView.BLURB_MIN_BAR_HEIGHT is a threshold below which a bar cannot appear any shorter
// in the eyes of this._computeHoverInformation().
// This makes it possible to hover over very short bars.
BarChunkView.HOVER_MIN_BAR_HEIGHT = 30;

BarChunkView.prototype = Object.create(EventEmitter.prototype);
BarChunkView.prototype.constructor = BarChunkView;

BarChunkView.prototype.handoff = function(oldChunkView) {
  oldChunkView._blurbManager.removeAllListeners();
  this._blurbManager.removeAllListeners();
  this._blurbManager = oldChunkView._blurbManager;
  this._registerBlurbManagerEvents();
};

BarChunkView.prototype.getWidth = function() {
  var landscape = this._morphingLandscape();
  var range = {
    startIndex: this._startIndex,
    length: this._morphingPointCount()
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

BarChunkView.prototype.pointerLeave = function() {
  this._pointerPosition = null;
  this.emit('redraw');
};

BarChunkView.prototype.pointerMove = function(pos) {
  this._pointerPosition = pos;
  this.emit('redraw');
};

BarChunkView.prototype.pointerClick = function() {
};

BarChunkView.prototype.draw = function(viewport, scrollX, maxValue) {
  var totalCount = this._morphingEncompassingCount();
  var pointCount = this._morphingPointCount();

  var landscape = this._morphingLandscape();
  var range = landscape.computeRange({left: scrollX, width: viewport.width});

  assert(range.length <= totalCount && range.startIndex < totalCount);
  assert(range.length > 0 || range.startIndex === 0);

  if (this.getEncompassingWidth() <= viewport.width) {
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
    return {left: viewport.x, width: 0, xmarkers: []};
  }

  var drawOffset = viewport.x - scrollX;
  var xmarkers = this._drawRange({
    drawOffset: drawOffset,
    landscape: landscape,
    range: range,
    viewport: viewport,
    maxValue: maxValue
  });

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

  this._updateBlurbManager(viewport, scrollX, maxValue);
  if (this._blurbManager.blurb() !== null) {
    this._blurbManager.blurb().draw(viewport.context);
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
    viewport.context.translate(viewport.x, 0);
    viewport.context.scale(stretchFactor, 1);
    var markers = this._drawRange({
      drawOffset: 0,
      landscape: landscape,
      range: range,
      viewport: {
        context: viewport.context,
        x: 0,
        y: viewport.y,
        height: viewport.height,
        width: landscape.width(),
        fullX: viewport.x,
        fullY: viewport.y,
        fullWidth: viewport.fullWidth,
        fullHeight: viewport.fullHeight
      },
      maxValue: maxValue
    });
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

    this._updateBlurbManagerElongated(viewport, stretchFactor, maxValue);
    if (this._blurbManager.blurb() !== null) {
      this._blurbManager.blurb().draw(viewport.context);
    }

    return result;
  }

  var left = viewport.x;
  if (stretchMode === BarStyleAttrs.STRETCH_MODE_JUSTIFY_CENTER) {
    left += (viewport.width - landscape.width()) / 2;
  } else if (stretchMode === BarStyleAttrs.STRETCH_MODE_JUSTIFY_RIGHT) {
    left += viewport.width - landscape.width();
  }

  var markers = this._drawRange({
    drawOffset: left,
    landscape: landscape,
    range: range,
    viewport: viewport,
    maxValue: maxValue
  });

  this._updateBlurbManager({
    x: left,
    y: viewport.y,
    width: viewport.width - (left - viewport.x),
    height: viewport.height,
    fullX: viewport.fullX,
    fullY: viewport.fullY,
    fullWidth: viewport.fullWidth,
    fullHeight: viewport.fullHeight
  }, 0, maxValue);
  if (this._blurbManager.blurb() !== null) {
    this._blurbManager.blurb().draw(viewport.context);
  }

  var region = landscape.computeRegion(range);
  return {
    left: region.left + left,
    width: region.width,
    xmarkers: markers
  };
};

BarChunkView.prototype._drawRange = function(p) {
  p.viewport.context.save();
  p.viewport.context.beginPath();
  p.viewport.context.rect(p.viewport.x, p.viewport.y, p.viewport.width, p.viewport.height);
  p.viewport.context.clip();

  var pointCount = this._morphingPointCount();

  var colorScheme = this._attrs.getColorScheme();
  var colors = [colorScheme.getPrimary(), colorScheme.getSecondary()];
  var ctx = p.viewport.context;
  var xmarkers = [];

  for (var i = p.range.startIndex, end = p.range.startIndex+p.range.length; i < end; ++i) {
    assert(i >= this._startIndex && i < this._startIndex + pointCount);

    var dataPoint = this._morphingGetPoint(i - this._startIndex);
    var values = [dataPoint.primary];
    if (dataPoint.secondary >= 0) {
      values.push(dataPoint.secondary);
    }

    var coords = p.landscape.computeBarRegion(i);
    coords.left += p.drawOffset;

    var xmarker = this._computeXMarker(p.landscape, p.drawOffset, i);
    xmarkers.push(xmarker);

    for (var j = 0, len = values.length; j < len; ++j) {
      var val = values[j];
      var height = p.viewport.height * (val / p.maxValue);
      var y = p.viewport.y + p.viewport.height - height;

      ctx.fillStyle = colors[j];

      var eclipseHeight = 0;
      if (j === 0 && values.length > 1) {
        eclipseHeight = p.viewport.height * (values[1] / p.maxValue);
      }

      this._drawValue({
        ctx: ctx,
        x: coords.left,
        y: y,
        width: coords.width,
        height: height,
        eclipseHeight: eclipseHeight,
        pointIndex: i,
        primary: j === 0,
        properness: this._morphingGetPointProperness(i - this._startIndex)
      });
    }
  }

  p.viewport.context.restore();
  return xmarkers;
};

BarChunkView.prototype._drawValue = function(params) {
  var ctx = params.ctx;
  if (params.properness < 1) {
    var oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha *= 0.6 + 0.4*params.properness;
    ctx.fillRect(params.x, params.y, params.width, params.height-params.eclipseHeight);
    ctx.globalAlpha = oldAlpha;
  } else {
    ctx.fillRect(params.x, params.y, params.width, params.height-params.eclipseHeight);
  }
};

// _computeXMarker generates an XMarker object for a bar being drawn by _drawRange.
BarChunkView.prototype._computeXMarker = function(landscape, drawOffset, idx) {
  assert(idx >= this._startIndex && idx < this._startIndex + this._morphingPointCount());

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

BarChunkView.prototype._updateBlurbManager = function(viewport, scrollX, maxValue) {
  var animating = (this._animationType !== BarChunkView.ANIMATION_NONE);

  if (this._pointerPosition === null ||
      this._pointerPosition.x < viewport.x ||
      this._pointerPosition.y < viewport.y ||
      this._pointerPosition.x >= viewport.x+viewport.width ||
      this._pointerPosition.y >= viewport.y+viewport.height) {
    this._blurbManager.update(animating, viewport, scrollX, null, null);
    return;
  }

  var landscapeCoords = {
    x: this._pointerPosition.x + scrollX - viewport.x,
    y: this._pointerPosition.y
  };

  var visibleRegion = {
    left: scrollX,
    width: viewport.width
  };

  var info = this._computeHoverInformation(landscapeCoords, viewport, maxValue, visibleRegion);
  if (info === null) {
    this._blurbManager.update(animating, viewport, scrollX, null, null);
  } else {
    var vpPoint = {
      x: info.position.x - scrollX + viewport.x,
      y: info.position.y
    };
    vpPoint.x = Math.min(viewport.x+viewport.width, Math.max(viewport.x, vpPoint.x));
    this._blurbManager.update(animating, viewport, scrollX, vpPoint, info.text);
  }
};

BarChunkView.prototype._updateBlurbManagerElongated = function(viewport, factor, maxValue) {
  var animating = (this._animationType !== BarChunkView.ANIMATION_NONE);

  if (this._pointerPosition === null ||
      this._pointerPosition.x < viewport.x ||
      this._pointerPosition.y < viewport.y ||
      this._pointerPosition.x >= viewport.x+viewport.width ||
      this._pointerPosition.y >= viewport.y+viewport.height) {
    this._blurbManager.update(animating, viewport, 0, null, null);
    return;
  }

  var landscapeCoords = {
    x: (this._pointerPosition.x - viewport.x) / factor,
    y: this._pointerPosition.y
  };

  var visibleRegion = {
    left: 0,
    width: viewport.width
  };

  var info = this._computeHoverInformation(landscapeCoords, viewport, maxValue, visibleRegion);
  if (info === null) {
    this._blurbManager.update(animating, viewport, 0, null, null);
  } else {
    var vpPoint = {
      x: (info.position.x * factor) + viewport.x,
      y: info.position.y
    };
    vpPoint.x = Math.min(viewport.x+viewport.width, Math.max(viewport.x, vpPoint.x));
    this._blurbManager.update(animating, viewport, 0, vpPoint, info.text);
  }
};

// _computeHoverInformation figures out what value the user is hovering over.
// It takes the pointer position in complete landscape coordinates rather than in
// viewport coordinates. In other words, the x-value of the position is translated and
// scaled so as not to change as the user scrolls or stretches the graph.
//
// The visibleRegion argument hints at what parts of the complete landscape are visible to
// the user. This can prevent blurbs from appearing next to completely hidden points.
//
// The returned object will either be null (no value is hovered) or be an object
// with the following keys:
// - text: the tooltip text
// - position: the complete landscape coordinates to which the corresponding blurb should point
BarChunkView.prototype._computeHoverInformation = function(pointerPos, viewport, maxValue,
                                                           visibleRegion) {
  var landscape = this._morphingLandscape();
  var range = landscape.computeRange({left: pointerPos.x, width: 1});
  var index = range.startIndex;
  if (index < this._startIndex || index >= this._startIndex+this._morphingPointCount()) {
    return null;
  }
  var region = landscape.computeBarRegion(index);
  if (pointerPos.x < region.left || pointerPos.x >= region.left+region.width) {
    return null;
  }
  var point = this._morphingGetPoint(index - this._startIndex);

  if (point.hasOwnProperty('secondaryTooltip') && point.secondary >= 0) {
    var secondaryHeight = (point.secondary / maxValue) * viewport.height;
    if (pointerPos.y >= viewport.y+viewport.height-secondaryHeight) {
      return {
        text: point.secondaryTooltip,
        position: {
          x: region.left + region.width/2,
          y: viewport.y + viewport.height - secondaryHeight
        }
      };
    }
  }

  if (point.hasOwnProperty('primaryTooltip')) {
    var primaryHeight = (point.primary / maxValue) * viewport.height;
    var usePrimaryHeight = Math.max(primaryHeight, BarChunkView.HOVER_MIN_BAR_HEIGHT);
    if (pointerPos.y >= viewport.y+viewport.height-usePrimaryHeight) {
      return {
        text: point.primaryTooltip,
        position: {
          x: region.left + region.width/2,
          y: viewport.y + viewport.height - primaryHeight
        }
      };
    }
  }

  return null;
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
  }
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
      secondary: -1,
      proper: newPoint.proper
    };

    if (newPoint.hasOwnProperty('primaryTooltip')) {
      intermediatePoint.primaryTooltip = newPoint.primaryTooltip;
    }
    if (newPoint.hasOwnProperty('secondaryTooltip')) {
      intermediatePoint.secondaryTooltip = newPoint.secondaryTooltip;
    }

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

// _morphingGetPointProperness returns the amount that a data point (given by a chunk-relative
// index) is proper.
// If the point is not being modified, this will return 1 if the data point is proper and
// 0 if it is not. Otherwise, it will return something inbetween.
BarChunkView.prototype._morphingGetPointProperness = function(idx) {
  assert(idx >= 0);
  assert(idx < this._morphingPointCount());

  var amountProper = 0;
  if (this._animationType === BarChunkView.ANIMATION_MODIFY &&
      idx + this._startIndex === this._animationPointIndex) {
    var oldProper = this._animationDataPoint.proper;
    var newProper = this._dataPoints[idx].proper;

    var oldAmount = (oldProper ? 1 : 0);
    var newAmount = (newProper ? 1 : 0);

    amountProper = this._animationProgress*newAmount + (1-this._animationProgress)*oldAmount;
  } else {
    var proper = this._morphingGetPoint(idx).proper;
    amountProper = (proper ? 1 : 0);
  }

  return amountProper;
};

BarChunkView.prototype._registerBlurbManagerEvents = function() {
  // TODO: prevent duplicate redraw emissions when the BarChunkView is already animating.
  this._blurbManager.on('redraw', this.emit.bind(this, 'redraw'));
};
