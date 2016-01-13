function XLCV() {
  window.graphalicious.ylcv.View.apply(this, arguments);
}

XLCV.prototype = Object.create(window.graphalicious.ylcv.View.prototype);

XLCV.prototype._drawClippedContent = function(info) {
  if (info === null) {
    return;
  }
  var ctx = info.viewport.context;
  var markers = info.report.xMarkers;
  var range = markers.computeRange({left: info.viewport.x-1, width: info.viewport.width+2});
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 2;
  ctx.lineCap = 'square';

  ctx.fillStyle = '#999';
  ctx.font = '16px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  for (var i = range.startIndex, end = range.startIndex+range.length; i < end; ++i) {
    var marker = markers.getXMarker(i);
    ctx.beginPath();
    ctx.moveTo(marker.x, 300-40);
    ctx.lineTo(marker.x, 300-34);
    ctx.stroke();

    ctx.globalAlpha = this._xlcvOpacity();
    ctx.fillText(this._config.dataSource.getXAxisLabel(i), marker.x,
      300-20+this._xlcvTranslation());
    ctx.globalAlpha = 1;
  }
};

XLCV.prototype._xlcvOpacity = function() {
  return 1;
};

XLCV.prototype._xlcvTranslation = function() {
  return 0;
};
