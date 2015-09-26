// The View displays graph content.
function View(colorScheme) {
  this._element = document.createElement('div');
  this._colorScheme = colorScheme;

  this._scrollBar = new ScrollBar(colorScheme);
  this._element.appendChild(this._scrollBar.element());

  this._content = null;

  this._scrolls = false;
  this._scrollbarAnimationStart = null;
  this._scrollbarAnimation = null;
}

View.prototype.element = function() {
  return this._element;
};

View.prototype.layout = function(width, height) {
  // TODO: layout the scrollbar and the content.
};

View.prototype._recomputeScrolls = function() {
  // TODO: trigger an animation if this should scroll but it's not scrolling or vice versa.
};

exports.View = View;
