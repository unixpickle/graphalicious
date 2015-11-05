//deps includes.js

function BarChunkView(colorScheme, chunk, dataSource, spacing, margin, barWidth) {
  EventEmitter.call(this);

  this._colorScheme = colorScheme;
  this._points = [];
  this._chunk = chunk;
  this._right = dataSource.getLength() - (chunk.getStartIndex() + chunk.getLength());
  this._left = chunk.getStartIndex();
  this._spacing = spacing;
  this._margin = margin;
  this._barWidth = barWidth;

  for (var i = 0, len = chunk.getLength(); i < len; ++i) {
    this._points.push(chunk.getDataPoint(i));
  }
}

BarChunkView.prototype = Object.create(EventEmitter.prototype);

BarChunkView.prototype.getInherentWidth = function() {
  var barsWidth = this._barWidth*this._points.length + this._spacing*(this._points.length-1);
  barsWidth += (this._left === 0 ? this._margin : this._spacing);
  barsWidth += (this._right === 0 ? this._margin : this._spacing);
  return barsWidth;
};

BarChunkView.prototype.getLeftOffset = function() {
  if (this._left === 0) {
    return 0;
  } else if (this._right === 0 && this._points.length === 0) {
    return this.getInherentWidth();
  }
  return this._margin + this._left*this._barWidth + (this._left-1)*this._spacing;
};

BarChunkView.prototype.getRightOffset = function() {
  if (this._right === 0) {
    return 0;
  } else if (this._left === 0 && this._points.length === 0) {
    return this.getInherentWidth();
  }
  return this._margin + this._right*this._barWidth + (this._right-1)*this._spacing;
};

BarChunkView.prototype.firstVisibleDataPoint = function(leftOffset) {
  var left = leftOffset + this.getLeftOffset();
  var startIndex = Math.floor((left-this._margin) / (this._spacing+this._barWidth));
  return Math.max(0, Math.min(this._points.length-1, startIndex-this._left));
};

BarChunkView.prototype.lastVisibleDataPoint = function(endLeftOffset) {
  var left = endLeftOffset + this.getLeftOffset();
  var endIndex = Math.ceil((left-this._margin) / (this._spacing+this._barWidth));
  return Math.max(0, Math.min(this._points.length-1, endIndex-this._left));
};

BarChunkView.prototype.xAxisLabelPosition = function(index) {
  // TODO: this.
  return 0;
};

BarChunkView.prototype.getPostAnimationInherentWidth = function() {
  return this.getInherentWidth();
};

BarChunkView.prototype.getPostAnimationLeftOffset = function() {
  return this.getLeftOffset();
};

BarChunkView.prototype.getPostAnimationRightOffset = function() {
  return this.getRightOffset();
};

BarChunkView.prototype.postAnimationFirstVisibleDataPoint = function(leftOffset) {
  return this.firstVisibleDataPoint(leftOffset);
};

BarChunkView.prototype.postAnimationLastVisibleDataPoint = function(endLeftOffset) {
  return this.lastVisibleDataPoint(endLeftOffset);
};

BarChunkView.prototype.postAnimationXAxisLabelPosition = function(index) {
  return this.xAxisLabelPosition(index);
};

BarChunkView.prototype.setAnimate = function(flag) {
};

BarChunkView.prototype.finishAnimation = function() {
};

BarChunkView.prototype.deletionBefore = function(index) {
  --this._left;
};

BarChunkView.prototype.deletionAfter = function(index) {
  --this._right;
};

BarChunkView.prototype.deletionInside = function(index) {
  this._points.splice(index-this._left, 1);
};

BarChunkView.prototype.insertionBefore = function(index) {
  ++this._left;
};

BarChunkView.prototype.insertionInside = function(index) {
  var relIndex = index - this._left;
  this._points.splice(relIndex, 0, this._chunk.getDataPoint(relIndex));
};

BarChunkView.prototype.insertionAfter = function(index) {
  --this._right;
};

BarChunkView.prototype.modifyInside = function(index) {
  var relIndex = index - this._left;
  this._points[relIndex] = this._chunk.getDataPoint(relIndex);
};

BarChunkView.prototype.pointerMove = function(pos) {
};

BarChunkView.prototype.pointerDown = function(pos) {
};

BarChunkView.prototype.pointerUp = function(pos) {
};

BarChunkView.prototype.pointerLeave = function() {
};

BarChunkView.prototype.draw = function(regionLeft, regionWidth, x, y, height, maxValue, ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, regionWidth, height);
  ctx.clip();
  ctx.fillStyle = this._colorScheme.getPrimary();

  var startIndex = this.firstVisibleDataPoint(regionLeft);
  var endIndex = this.lastVisibleDataPoint(regionLeft + regionWidth);

  var startLeft = (this._spacing + this._barWidth) * startIndex;
  if (this._start === 0) {
    startLeft += this._margin;
  } else {
    startLeft += this._spacing;
  }

  this._drawBars(startIndex, endIndex, x-(regionLeft-startLeft), y, height, maxValue,
    this._barWidth, this._spacing, ctx);

  ctx.restore();
};

BarChunkView.prototype.drawStretched = function(x, y, width, height, maxValue, ctx) {
  var inherentWidth = this.getInherentWidth();
  var left = x+width-(this.getRightOffset()+inherentWidth);
  this.draw(0, inherentWidth, left, y, height, maxValue, ctx);
  return {left: left, width: inherentWidth};
};

BarChunkView.prototype._drawBars = function(start, end, x, y, height, maxVal, barWidth,
                                             barSpace, ctx) {
  for (var i = start; i <= end; ++i) {
    var value = this._points[i];
    var barX = x + (i-start)*(barWidth+barSpace);
    var barHeight = height * (value.primary / maxVal);
    ctx.fillRect(barX, y+height-barHeight, barWidth, barHeight);
  }
};
