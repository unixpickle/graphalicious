//deps includes.js

function View(config) {
  EventEmitter.call(this);
  this._headlessView = new HeadlessView(config);
  this._bufferedView = new BufferedView(config);

  this._headlessView.on('change', this._updateView.bind(this));
  this._bufferedView.on('change', this._updateView.bind(this));

  this._lastScrollState = null;
}

View.prototype = Object.create(EventEmitter.prototype);

View.prototype.element = function() {
  return this._bufferedView.element();
};

View.prototype.dispose = function() {
  this._bufferedView.dispose();
  this._headlessView.dispose();
};

View.prototype.layout = function(w, h) {
  this._headlessView.layout(w, h);
  this._bufferedView.layout(w, h);
  this._updateView();
};

View.prototype.getScrollState = function() {
  if (this._headlessView.shouldShowContent()) {
    return this._headlessView.instantaneousState().getScrollState();
  } else if (this._lastScrollState !== null && !this._bufferedView.showingSplash()) {
    return this._lastScrollState;
  } else {
    return new window.scrollerjs.State(0, 0, 0);
  }
};

View.prototype.setScrolledPixels = function(p) {
  this._headlessView.setScrolledPixels(p);
  this._updateView(false);
};

View.prototype.setAnimate = function(a) {
  this._headlessView.setAnimate(a);
  this._bufferedView.setAnimate(a);
};

View.prototype._updateView = function(emitChange) {
  if (this._headlessView.shouldShowContent()) {
    this._lastScrollState = this._headlessView.instantaneousState().getScrollState();
    this._bufferedView.setChunkView(this._headlessView.chunkView());
    this._bufferedView.setYLabels(this._headlessView.instantaneousState().getYLabels());

    var cv = this._lastScrollState.getScrolledPixels() -
      this._headlessView.instantaneousState().getLeftmostLabels().totalWidth();
    this._bufferedView.setChunkViewOffset(cv);

    this._bufferedView.draw();
  } else {
    this._bufferedView.setChunkView(null);
    this._bufferedView.setYLabels(null);
    this._bufferedView.setChunkViewOffset(0);
    this._bufferedView.draw();
  }

  // TODO: update the loaders and the splash screen.

  // TODO: check if the scroll state actually changed.
  this.emit('scrollStateChange');
};

exports.View = View;
