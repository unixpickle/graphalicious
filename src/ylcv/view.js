//deps includes.js

function View(config) {
  EventEmitter.call(this);
  this._config = config;
  this._headlessView = new HeadlessView(config);
  this._bufferedView = new BufferedView(config);

  this._headlessView.on('change', this._updateView.bind(this, true));
  this._bufferedView.on('change', this._updateView.bind(this, true));

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
  this._updateView(true);
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
  var scrollStateChange = false;
  if (this._headlessView.shouldShowContent()) {
    var newScrollState = this._headlessView.instantaneousState().getScrollState();
    if (this._lastScrollState === null || !newScrollState.equals(this._lastScrollState)) {
      this._lastScrollState = newScrollState;
      scrollStateChange = true;
    }
    this._bufferedView.setChunkView(this._headlessView.chunkView());
    this._bufferedView.setYLabels(this._headlessView.instantaneousState().getYLabels());
    this._bufferedView.setChunkViewMargins(this._headlessView.chunkViewMargins());

    var cv = newScrollState.getScrolledPixels() -
      this._headlessView.instantaneousState().getLeftmostLabels().totalWidth();
    this._bufferedView.setChunkViewOffset(cv);

    this._bufferedView.draw();
  } else {
    this._bufferedView.setChunkView(null);
    this._bufferedView.setYLabels(null);
    this._bufferedView.setChunkViewOffset(0);
    this._bufferedView.setChunkViewMargins(null);
    this._bufferedView.draw();
  }

  this._updateLoaderStates();

  if (emitChange && scrollStateChange) {
    this.emit('scrollStateChange');
  }
};

View.prototype._updateLoaderStates = function() {
  var dataSource = this._config.dataSource;
  if (dataSource.isLoadingChunk(HeadlessView.CURRENT_CHUNK)) {
    this._config.loader1.showLoading();
    this._config.loader2.showLoading();
  } else {
    this._config.loader1.showError();
    this._config.loader2.showError();
  }

  // NOTE: if content should show, we enable the SplashScreen spinner
  // since the SplashScreen might stay visible for a moment in the
  // BufferedView.
  if (dataSource.isLoadingChunk(HeadlessView.LEFTMOST_CHUNK) ||
      this._headlessView.shouldShowContent()) {
    this._config.splashScreen.showLoading();
  } else {
    this._config.splashScreen.showError();
  }
};

exports.View = View;
