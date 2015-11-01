//deps includes.js

function BarViewProvider(colorScheme) {
  EventEmitter.call(this);
  this._colorScheme = colorScheme;
  this.spacing = 10;
  this.margin = 10;
  this.barWidth = 30;
}

BarViewProvider.prototype = Object.create(EventEmitter.prototype);

BarViewProvider.prototype.computeTheoreticalChunk = function(region, pointCount) {
  var startIndex = Math.floor((region.left-this.margin) / (this.spacing+this.barWidth));
  var endIndex = Math.ceil((region.left+region.width-this.margin) / (this.spacing+this.barWidth));
  var length = endIndex - startIndex;
  startIndex = Math.max(0, Math.min(pointCount-1, startIndex));
  length = Math.max(0, Math.min(length, pointCount-startIndex));
  return {startIndex: startIndex, length: length};
};

BarViewProvider.prototype.computeRegion = function(theoreticalChunk, pointCount) {
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

BarViewProvider.prototype.createChunkView = function(chunk, dataSource) {
  return new BarChunkView(this._colorScheme, chunk, dataSource, this.spacing, this.margin,
    this.barWidth);
};

exports.BarViewProvider = BarViewProvider;
