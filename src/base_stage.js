// BaseStage draws content in a ScrollView with y-axis labels.
function BaseStage(content, scrollView) {
  this._content = content;
  this._scrollView = scrollView;

  // TODO: figure out the other fields to put here.

  this._registerEvents();
}

// BaseStage.BUFFER_MAX is the number of screen-widths to the left and right the current fragment
// will include for buffering purposes. In a system with no buffering, BUFFER_MAX would be 0.
BaseStage.BUFFER_MAX = 5;

// BaseStage.BUFFER_MIN is the maximum number of screen-widths which can be to the left or right of
// the current fragment before a new current fragment is loaded in its place. If this were equal to
// BaseStage.BUFFER_MAX, a new fragment would be fetched every time the user scrolled by a single
// single pixel.
BaseStage.BUFFER_MIN = 2;

BaseStage.prototype._draw = function() {
  // TODO: this.
};

BaseStage.prototype._handleScroll = function() {
  // TODO: this.
};

BaseStage.prototype._layout = function() {
  // TODO: this.
};

BaseStage.prototype._registerEvents = function() {
  this._scrollView.on('layout', this._layout.bind(this));
  this._scrollView.on('scroll', this._handleScroll.bind(this));
  this._scrollView.on('draw', this._draw.bind(this));
  this._content.on('redraw', this._draw.bind(this));
  this._content.on('change', this._layout.bind(this));
};

exports.BaseStage = BaseStage;
