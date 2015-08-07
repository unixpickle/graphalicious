//deps event_emitter.js

// AscendingContent is simple content which implements the content interface.
// This can be used for testing purposes but serves no real functional purpose.
function AscendingContent(width) {
  EventEmitter.call(this);
  this._width = width || 1;
}

AscendingContent.SLOPE = 1;

AscendingContent.prototype = Object.create(EventEmitter.prototype);

// draw draws an ascending line.
AscendingContent.prototype.draw = function(startX, viewport) {
  viewport.enter();
  var context = viewport.context();
  context.strokeStyle = 'black';
  context.lineWidth = 2;
  context.beginPath();

  var width = viewport.width();
  if (width >= this._width) {
    context.moveTo(0, viewport.height());
    context.moveTo(viewport.width(), 0);
  } else {
    var startY = AscendingContent.SLOPE * startX;
    var endY = AscendingContent.SLOPE * (startX + viewport.width());
    var newStartY = viewport.height() * (1 - startY/endY);
    context.moveTo(0, newStartY);
    context.lineTo(viewport.width(), 0);
  }

  context.stroke();
  viewport.leave();
};

// formatYLabel formats a number as a fixed point.
AscendingContent.prototype.formatYLabel = function(x) {
  return x.toFixed(2);
};

// getFontFamily returns a default pre-defined font family.
AscendingContent.prototype.getFontFamily = function() {
  return 'sans-serif';
};

// getFontSize returns a default pre-defined font size.
AscendingContent.prototype.getFontSize = function() {
  return 18;
};

// getFontWeight returns a default pre-defined font weight.
AscendingContent.prototype.getFontWeight = function() {
  return 400;
};

// getWidth returns the width attribute.
AscendingContent.prototype.getWidth = function() {
  return this._width;
};

// maxValueInFrame uses some math to figure out the maximum value in a frame.
AscendingContent.prototype.maxValueInFrame = function(startX, width) {
  return AscendingContent.SLOPE * Math.min(this._width, startX+width);
};

// minWidth returns the width attribute.
AscendingContent.prototype.minWidth = function() {
  return this._width;
};

// niceYAxisDivisions divides values evenly.
AscendingContent.prototype.niceYAxisDivisions = function(maxValue, count) {
  maxValue = 20 * Math.ceil(maxValue / 20);

  var vals = [];
  for (var i = 0; i < count; ++i) {
    vals[i] = maxValue * i / (count - 1);
  }
  return vals;
};

// setWidth sets the internal width attribute and emits a change event.
AscendingContent.prototype.setWidth = function(w) {
  this._width = w;
  this.emit('change');
};

exports.AscendingContent = AscendingContent;
