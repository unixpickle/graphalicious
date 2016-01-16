function XLCV() {
  window.graphalicious.ylcv.View.apply(this, arguments);
  this._lastLabels = null;
  this._lastPointCount = 0;
}

XLCV.prototype = Object.create(window.graphalicious.ylcv.View.prototype);

XLCV.prototype._drawClippedContent = function(info) {
  if (info === null) {
    return;
  }
  var ctx = info.viewport.context;
  var markers = info.report.xMarkers;
  if (this._isAnimatingOut() && this._lastLabels !== null) {
    markers = this._lastLabels;
  } else {
    this._lastLabels = markers;
    this._lastPointCount = globalDataSource.getLength();
  }

  var range = info.report.xMarkers.computeRange({
    left: info.viewport.x-1,
    width: info.viewport.width+2
  });
  this._drawTicks(ctx, info.report.xMarkers, range, this._tickOpacity());

  range = markers.computeRange({left: info.viewport.x-1, width: info.viewport.width+2});
  this._drawLabels(ctx, markers, range);
};

XLCV.prototype._drawTicks = function(ctx, markers, range, alpha) {
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 2;
  ctx.lineCap = 'square';

  for (var i = range.startIndex, end = range.startIndex+range.length; i < end; ++i) {
    var visibility = 1;
    var marker = markers.getXMarker(i);
    if (marker.animationProgress >= 0) {
      visibility = marker.animationProgress;
      if (marker.index < 0) {
        visibility = 1 - visibility;
      }
    }
    ctx.globalAlpha = alpha * visibility;
    ctx.beginPath();
    ctx.moveTo(marker.x, 300-39);
    ctx.lineTo(marker.x, 300-34);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
};

XLCV.prototype._drawLabels = function(ctx, markers, range) {
  ctx.fillStyle = '#999';
  ctx.font = '16px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  for (var i = range.startIndex, end = range.startIndex+range.length; i < end; ++i) {
    if ((i % 2) === 0) {
      continue;
    }
    ctx.globalAlpha = this._labelOpacity();
    var marker = markers.getXMarker(i);
    ctx.fillText(this._config.dataSource.getXAxisLabel(i), marker.x,
      300-20+this.translation());
    ctx.globalAlpha = 1;
  }
};

XLCV.prototype._labelOpacity = function() {
  if (document.getElementById('fade-labels').checked) {
    return xLabelVisibility();
  } else {
    return 1;
  }
};

XLCV.prototype._tickOpacity = function() {
  if (document.getElementById('fade-ticks').checked) {
    return xLabelVisibility();
  } else {
    return 1;
  }
};

XLCV.prototype.translation = function() {
  if (document.getElementById('slide-labels').checked) {
    return 35 - 35*xLabelVisibility();
  } else {
    return 0;
  }
};

XLCV.prototype._isAnimatingOut = function() {
  if (!animationHarmonizer.isAnimating()) {
    return false;
  }
  return animationRunTime <= XLCV_HIDE_DURATION;
};

function xLabelVisibility() {
  if (!animationHarmonizer.isAnimating()) {
    return 1;
  }
  var time = animationRunTime;
  if (time > XLCV_ANIMATION_DURATION) {
    return 1;
  }
  if (time < XLCV_HIDE_DURATION) {
    return 1 - time/XLCV_HIDE_DURATION;
  } else if (time < XLCV_HIDE_DURATION+XLCV_STAGNATE_DURATION) {
    return 0;
  } else {
    return (time-XLCV_HIDE_DURATION-XLCV_STAGNATE_DURATION) /
      (XLCV_ANIMATION_DURATION-XLCV_HIDE_DURATION-XLCV_STAGNATE_DURATION);
  }
}
