function MorphingBarLandscape(info) {
  this._pointCount = info.pointCount;
  this._attrs = info.attrs;
  this._morphingIndex = info.morphingIndex;
  this._morphingVisibility = info.morphingVisibility || 0;
}

MorphingBarLandscape.prototype.computeRange = function(region, pointCount) {
  // TODO: this.
};

MorphingBarLandscape.prototype.computeRegion = function(range, pointCount) {
  // TODO: this.
};

// _width returns the width of the complete morphing landscape.
MorphingBarLandscape.prototype._width = function() {
  var biggerWidth = this._attrs.computeRegion({startIndex: 0, length: this._pointCount},
    this._pointCount).width;
  var smallerWidth = this._attrs.computeRegion({startIndex: 0, length: this._pointCount-1},
    this._pointCount-1).width;
  return this._morphingVisibility*biggerWidth + (1-this._morphingVisibility)*smallerWidth;
};

// _leadingSpace returns the number of pixels before the first pixel of the morphing bar.
MorphingBarLandscape.prototype._leadingSpacing = function() {
  if (this._morphingIndex === 0) {
    return this._attrs.getLeftMargin();
  } else if (this._morphingIndex === this._pointCount-1) {
    return this._attrs.computeRegion({startIndex: 0, length: this._pointCount}, 
      this._pointCount).width - this._attrs.getRightMargin() - this._morphingBarWidth();
  }
  return this._attrs.getLeftMargin() + this._morphingIndex*this._attrs.getBarWidth() +
    (this._morphingIndex-1)*this._attrs.getBarSpacing() +
    (0.5 + 0.5*this._morphingVisibility)*this._attrs.getBarSpacing();
};

// _trailingSpace returns the number of pixels after the last pixel of the morphing bar.
MorphingBarLandscape.prototype._trailingSpace = function() {
  return this._width() - (this._leadingSpace() + this._morphingBarWidth());
};

MorphingBarLandscape.prototype._morphingBarWidth = function() {
  if (this._morphingIndex === 0 || this._morphingIndex === this._pointCount-1) {
    var y = this._attrs.getBarWidth() + this._attrs.getBarSpacing();
    return Math.max(0, this._morphingVisibility*y - this._attrs.getBarSpacing());
  }
  return this._morphingVisibility * this._attrs.getBarWidth();
};
