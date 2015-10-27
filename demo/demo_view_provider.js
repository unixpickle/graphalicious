(function() {

  var assert = window.graphalicious.base.assert;
  var EventEmitter = window.graphalicious.base.EventEmitter;

  function DemoViewProvider(colorScheme) {
    EventEmitter.call(this);
    this._colorScheme = colorScheme;
    this.spacing = 10;
    this.margin = 10;
    this.barWidth = 30;
  }

  DemoViewProvider.prototype = Object.create(EventEmitter.prototype);

  DemoViewProvider.prototype.computeTheoreticalChunk = function(region, pointCount) {
    var startIndex = Math.floor((region.left-this.margin) / (this.spacing+this.barWidth));
    var endIndex = Math.ceil((region.left+region.width-this.margin) / (this.spacing+this.barWidth));
    var length = endIndex - startIndex;
    startIndex = Math.max(0, Math.min(pointCount-1, startIndex));
    length = Math.max(0, Math.min(length, pointCount-startIndex));
    return {startIndex: startIndex, length: length};
  };

  DemoViewProvider.prototype.computeRegion = function(theoreticalChunk, pointCount) {
    var maxLeft = this.margin*2 + pointCount*this.barWidth + (pointCount-1)*this.spacing;

    var startLeft = 0;
    if (theoreticalChunk.startIndex >= pointCount-1) {
      startLeft = maxLeft;
    } else if (theoreticalChunk.startIndex > 0) {
      startLeft = this.margin + (this.spacing+this.barWidth)*theoreticalChunk.startIndex;
    }

    var endLeft = 0;
    var endIndex = theoreticalChunk.startIndex + theoreticalChunk.length - 1;
    if (endIndex >= pointCount-1) {
      endLeft = maxLeft
    } else if (endIndex > 0) {
      endLeft = this.margin + (this.spacing+this.barWidth)*theoreticalChunk.startIndex;
    }

    assert(startLeft <= endLeft);

    return {left: startLeft, width: endLeft-startLeft};
  };

  DemoViewProvider.prototype.createChunkView = function(chunk, dataSource) {
    return new DemoChunkView(this._colorScheme, chunk, dataSource, this.spacing, this.margin,
      this.barWidth);
  };

  function DemoChunkView(colorScheme, chunk, dataSource, spacing, margin, barWidth) {
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

    this._colorScheme.on('change', this.emit.bind('redraw'));
  }

  DemoChunkView.prototype = Object.create(EventEmitter.prototype);

  DemoChunkView.prototype.getInherentWidth = function() {
    var barsWidth = this._barWidth*this._points.length + this._spacing*(this._points.length-1);
    barsWidth += (this._left === 0 ? this._margin : this._spacing);
    barsWidth += (this._right === 0 ? this._margin : this._spacing);
    return barsWidth;
  };

  DemoChunkView.prototype.getLeftOffset = function() {
    if (this._left === 0) {
      return 0;
    } else if (this._right === 0 && this._points.length === 0) {
      return this.getInherentWidth();
    }
    return this._margin + this._left*this._barWidth + (this._left-1)*this._spacing;
  };

  DemoChunkView.prototype.getRightOffset = function() {
    if (this._right === 0) {
      return 0;
    } else if (this._left === 0 && this._points.length === 0) {
      return this.getInherentWidth();
    }
    return this._margin + this._right*this._barWidth + (this._right-1)*this._spacing;
  };

  DemoChunkView.prototype.firstVisibleDataPoint = function(leftOffset) {
    var left = leftOffset + this.getLeftOffset();
    var startIndex = Math.floor((left-this._margin) / (this._spacing+this._barWidth));
    return Math.max(0, Math.min(this._points.length-1, startIndex-this._left));
  };

  DemoChunkView.prototype.lastVisibleDataPoint = function(endLeftOffset) {
    var left = endLeftOffset + this.getLeftOffset();
    var endIndex = Math.ceil((left-this._margin) / (this._spacing+this._barWidth));
    return Math.max(0, Math.min(this._points.length-1, endIndex-this._left));
  };

  DemoChunkView.prototype.xAxisLabelPosition = function(index) {
    // TODO: this.
    return 0;
  };

  DemoChunkView.prototype.getPostAnimationInherentWidth = function() {
    return this.getInherentWidth();
  };

  DemoChunkView.prototype.getPostAnimationLeftOffset = function() {
    return this.getLeftOffset();
  };

  DemoChunkView.prototype.getPostAnimationRightOffset = function() {
    return this.getRightOffset();
  };

  DemoChunkView.prototype.postAnimationFirstVisibleDataPoint = function(leftOffset) {
    return this.firstVisibleDataPoint(leftOffset);
  };

  DemoChunkView.prototype.postAnimationLastVisibleDataPoint = function(endLeftOffset) {
    return this.lastVisibleDataPoint(endLeftOffset);
  };

  DemoChunkView.prototype.postAnimationXAxisLabelPosition = function(index) {
    return this.xAxisLabelPosition(index);
  };

  DemoChunkView.prototype.setAnimate = function(flag) {
  };

  DemoChunkView.prototype.finishAnimation = function() {
  };

  DemoChunkView.prototype.deletionBefore = function(index) {
    --this._left;
  };

  DemoChunkView.prototype.deletionAfter = function(index) {
    --this._right;
  };

  DemoChunkView.prototype.deletionInside = function(index) {
    this._points.splice(index-this._left, 1);
  };

  DemoChunkView.prototype.insertionBefore = function(index) {
    ++this._left;
  };

  DemoChunkView.prototype.insertionInside = function(index) {
    var relIndex = index - this._left;
    this._points.splice(relIndex, 0, this._chunk.getDataPoint(relIndex));
  };

  DemoChunkView.prototype.insertionAfter = function(index) {
    --this._right;
  };

  DemoChunkView.prototype.modifyInside = function(index) {
    var relIndex = index - this._left;
    this._points[relIndex] = this._chunk.getDataPoint(relIndex);
  };

  DemoChunkView.prototype.pointerMove = function(pos) {
  };

  DemoChunkView.prototype.pointerDown = function(pos) {
  };

  DemoChunkView.prototype.pointerUp = function(pos) {
  };

  DemoChunkView.prototype.pointerLeave = function() {
  };

  DemoChunkView.prototype.draw = function(regionLeft, regionWidth, x, y, height, maxValue, ctx) {
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

  DemoChunkView.prototype.drawStretched = function(x, y, width, height, maxValue, ctx) {
    var inherentWidth = this.getInherentWidth();
    var left = x+width-(this.getRightOffset()+inherentWidth);
    this.draw(0, inherentWidth, left, y, height, maxValue, ctx);
    return {left: left, width: inherentWidth};
  };

  DemoChunkView.prototype._drawBars = function(start, end, x, y, height, maxVal, barWidth,
                                               barSpace, ctx) {
    for (var i = start; i <= end; ++i) {
      var value = this._points[i];
      var barX = x + (i-start)*(barWidth+barSpace);
      var barHeight = height * (value.primary / maxVal);
      ctx.fillRect(barX, y+height-barHeight, barWidth, barHeight);
    }
  };

  window.DemoViewProvider = DemoViewProvider;

})();
