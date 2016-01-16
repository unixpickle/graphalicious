//deps includes.js

function BarChunkView(attrs, chunk, dataSource, harmonizerContext) {
  EventEmitter.call(this);

  assert('object' === typeof harmonizerContext);
  this._harmonizerContext = harmonizerContext;

  this._attrs = attrs;
  this._chunk = chunk;

  this._encompassingCount = dataSource.getLength();
  this._dataPoints = [];
  this._startIndex = chunk.getStartIndex();
  for (var i = 0, len = chunk.getLength(); i < len; ++i) {
    this._dataPoints.push(chunk.getDataPoint(i));
  }

  this._landscapeHarmonizer = new window.harmonizer.Harmonizer(this._harmonizerContext);
  this._landscapeHarmonizer.on('animationFrame', this._animate.bind(this));
  this._animationType = BarChunkView.ANIMATION_NONE;
  this._animationDataPoint = null;
  this._animationPointIndex = 0;
  this._animationProgress = 0;

  this._pointerPosition = null;
  this._blurbManager = new BlurbManager(attrs);
  // TODO: use a harmonizer for the blurb manager.
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

BarChunkView.prototype.harmonizer = function() {
  return this._landscapeHarmonizer;
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
  this._landscapeHarmonizer.stop();
  this._animationType = BarChunkView.ANIMATION_NONE;
};

BarChunkView.prototype.pointerLeave = function() {
  this._pointerPosition = null;
  this.harmonizer().requestPaint();
};

BarChunkView.prototype.pointerMove = function(pos) {
  this._pointerPosition = pos;
  this.harmonizer().requestPaint();
};

BarChunkView.prototype.pointerClick = function() {
};

BarChunkView.prototype.draw = function(viewport, scrollX, maxValue) {
  var params = this._computeDrawParams(viewport, scrollX, maxValue);

  this._drawRange(params);
  this._updateBlurbManager(params, scrollX);
  if (this._blurbManager.blurb() !== null) {
    this._blurbManager.blurb().draw(params.getViewport().context);
  }

  var landscapeRegion = params.getLandscape().computeRegion(params.getRange());
  var result = params.regionToCanvasRegion(landscapeRegion);

  var boundedResult = regionIntersection(result, {left: viewport.x, width: viewport.width});

  // If no content was visibily drawn, at least pass on the information of where
  // its off-screen edge would have been.
  if (boundedResult.width === 0) {
    if (result.left+result.width < viewport.x) {
      boundedResult.left = result.left+result.width;
    } else if (result.left > viewport.x+viewport.width) {
      boundedResult.left = result.left;
    }
  }

  boundedResult.xMarkers = this._generateXMarkers(params);
  return boundedResult;
};

BarChunkView.prototype._computeDrawParams = function(viewport, scrollX, maxValue) {
  if (this.getEncompassingWidth() <= viewport.width) {
    return this._stretchedDrawParams(viewport, maxValue);
  }

  var totalCount = this._morphingEncompassingCount();
  var pointCount = this._morphingPointCount();

  var landscape = this._morphingLandscape();
  var range = landscape.computeRange({left: scrollX, width: viewport.width});

  assert(range.startIndex+range.length <= totalCount);
  assert(range.startIndex >= 0 && range.length >= 0);
  assert(range.length > 0 || range.startIndex === 0);

  // NOTE: if the content is offscreen besides some whitespace at either edge,
  // include the data point at the edge so that we have something to draw.
  if (range.startIndex + range.length <= this._startIndex) {
    range = {startIndex: this._startIndex, length: 1};
  } else if (range.startIndex >= this._startIndex+pointCount) {
    range = {startIndex: this._startIndex+pointCount-1, length: 1};
  }

  range = rangeIntersection(range, {startIndex: this._startIndex, length: pointCount});
  var drawOffset = viewport.x - scrollX;
  return new BarDrawParams({
    drawOffset: drawOffset,
    landscape: landscape,
    range: range,
    viewport: viewport,
    maxValue: maxValue,
    stretchFactor: 1
  });
};

BarChunkView.prototype._stretchedDrawParams = function(viewport, maxValue) {
  var landscape = this._morphingLandscape();

  var range = {startIndex: this._startIndex, length: this._morphingPointCount()};

  var regularWidth = landscape.width();
  var stretchFactor;
  if (regularWidth === 0) {
    stretchFactor = 1;
  } else {
    stretchFactor = viewport.width / regularWidth;
  }
  stretchFactor = Math.min(stretchFactor, this._attrs.getMaxElongation());

  var stretchedWidth = regularWidth * stretchFactor;
  var justification = this._attrs.getJustification();

  var offset = 0;
  if (justification === BarStyleAttrs.JUSTIFY_CENTER) {
    offset = (viewport.width - stretchedWidth) / 2;
  } else if (justification === BarStyleAttrs.JUSTIFY_RIGHT) {
    offset = viewport.width - stretchedWidth;
  }

  return new BarDrawParams({
    drawOffset: viewport.x + offset/stretchFactor,
    landscape: landscape,
    range: range,
    viewport: viewport,
    maxValue: maxValue,
    stretchFactor: stretchFactor
  });
};

BarChunkView.prototype._drawRange = function(params) {
  params.clipViewport();

  var pointCount = this._morphingPointCount();
  var colorScheme = this._attrs.getColorScheme();
  var colors = [colorScheme.getPrimary(), colorScheme.getSecondary()];
  var range = params.getRange();
  var viewport = params.getViewport();
  var maxValue = params.getMaxValue();
  var ctx = viewport.context;

  for (var i = range.startIndex, end = range.startIndex+range.length; i < end; ++i) {
    assert(i >= this._startIndex && i < this._startIndex+pointCount);

    var dataPoint = this._morphingGetPoint(i - this._startIndex);
    var values = [dataPoint.primary];
    if (dataPoint.secondary >= 0) {
      values.push(dataPoint.secondary);
    }

    var barRegion = params.getLandscape().computeBarRegion(i);
    var barLeft = params.landscapeXToCanvasX(barRegion.left);
    var barWidth = params.landscapeWidthToCanvasWidth(barRegion.width);
    for (var j = 0, len = values.length; j < len; ++j) {
      var val = values[j];
      var height = viewport.height * (val / maxValue);
      var y = viewport.y + viewport.height - height;

      ctx.fillStyle = colors[j];

      var eclipseHeight = 0;
      if (j === 0 && values.length > 1) {
        eclipseHeight = viewport.height * (values[1] / maxValue);
      }

      this._drawValue({
        ctx: ctx,
        x: barLeft,
        y: y,
        width: barWidth,
        height: height,
        eclipseHeight: eclipseHeight,
        pointIndex: i,
        primary: j === 0,
        properness: this._morphingGetPointProperness(i - this._startIndex),
        stretchFactor: params.getStretchFactor()
      });
    }
  }

  params.unclipViewport();
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

// _generateXMarkers generates XMarkers for the current drawRange call.
BarChunkView.prototype._generateXMarkers = function(params) {
  var info = {
    drawParams: params,
    animationType: this._animationType,
    animationProgress: this._animationProgress,
    animationPointIndex: this._animationPointIndex,
    animationOldPoint: null
  };

  switch (this._animationType) {
  case BarChunkView.ANIMATION_MODIFY:
  case BarChunkView.ANIMATION_DELETE:
    info.animationOldPoint = this._animationDataPoint;
  }

  return new BarXMarkers(info);
};

BarChunkView.prototype._updateBlurbManager = function(params, scrollX) {
  var animating = (this._animationType !== BarChunkView.ANIMATION_NONE);

  var viewport = params.getViewport();
  if (this._pointerPosition === null ||
      this._pointerPosition.x < viewport.x ||
      this._pointerPosition.y < viewport.y ||
      this._pointerPosition.x >= viewport.x+viewport.width ||
      this._pointerPosition.y >= viewport.y+viewport.height) {
    this._blurbManager.update(animating, viewport, scrollX, null, null);
    return;
  }

  var landscapeCoords = {
    x: params.canvasXToLandscapeX(this._pointerPosition.x),
    y: this._pointerPosition.y
  };

  var visibleRegion = params.canvasRegionToRegion({
    left: viewport.x,
    width: viewport.width
  });

  var info = this._computeHoverInformation(landscapeCoords, params);
  if (info === null) {
    this._blurbManager.update(animating, viewport, scrollX, null, null);
  } else {
    var vpPoint = {
      x: params.landscapeXToCanvasX(info.position.x),
      y: info.position.y
    };
    vpPoint.x = Math.min(viewport.x+viewport.width, Math.max(viewport.x, vpPoint.x));
    this._blurbManager.update(animating, viewport, scrollX, vpPoint, info.text);
  }
};

// _computeHoverInformation figures out what value the user is hovering over.
// It takes the pointer position in complete landscape coordinates rather than in
// viewport coordinates. In other words, the x-value of the position is translated and
// scaled so as not to change as the user scrolls or stretches the graph.
//
// The returned object will either be null (no value is hovered) or be an object
// with the following keys:
// - text: the tooltip text
// - position: the complete landscape coordinates to which the blurb should point
BarChunkView.prototype._computeHoverInformation = function(pointerPos, drawParams) {
  var range = drawParams.getLandscape().computeRange({left: pointerPos.x, width: 1});
  var index = range.startIndex;
  if (index < this._startIndex || index >= this._startIndex+this._morphingPointCount()) {
    return null;
  }

  var region = drawParams.getLandscape().computeBarRegion(index);
  if (pointerPos.x < region.left || pointerPos.x >= region.left+region.width) {
    return null;
  }

  var viewport = drawParams.getViewport();

  var point = this._morphingGetPoint(index - this._startIndex);
  if (point.hasOwnProperty('secondaryTooltip') && point.secondary >= 0) {
    var secondaryHeight = (point.secondary / drawParams.getMaxValue()) * viewport.height;
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
    var primaryHeight = (point.primary / drawParams.getMaxValue()) * viewport.height;
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

BarChunkView.prototype._animate = function(elapsedMillis) {
  this.harmonizer().requestPaint();
  var elapsed = elapsedMillis / BarChunkView.ANIMATION_DURATION;
  if (elapsed >= 1) {
    elapsed = 1;
  }
  this._animationProgress = elapsed;
  if (elapsed === 1) {
    this.finishAnimation();
    this.emit('animationFrame', 1);
    this.emit('animationEnd');
  } else {
    this.emit('animationFrame', elapsed);
  }
};

BarChunkView.prototype._startAnimation = function(index, type, point) {
  this._animationPointIndex = index;
  this._animationDataPoint = point;
  this._animationProgress = 0;
  this._animationType = type;
  this._landscapeHarmonizer.start();
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
  this._blurbManager.on('redraw', function() {
    this.harmonizer().requestPaint();
  }.bind(this));
};
