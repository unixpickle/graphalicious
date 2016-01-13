//deps includes.js

function View(config) {
  EventEmitter.call(this);
  this._config = {};
  for (var i = 0, len = View.CONFIG_ATTRS.length; i < len; ++i) {
    var attr = View.CONFIG_ATTRS[i];
    if (config.hasOwnProperty(attr)) {
      this._config[attr] = config[attr];
    } else if (View.DEFAULTS.hasOwnProperty(attr)) {
      this._config[attr] = View.DEFAULTS[attr];
    } else {
      throw new Error('missing configuration attribute: ' + attr);
    }
  }
  this._headlessView = new HeadlessView(this._config);
  this._bufferedView = new BufferedView(this._config);

  this._headlessView.on('change', this._updateView.bind(this, true));
  this._bufferedView.on('change', this._updateView.bind(this, true));
  this._bufferedView.on('drawClipped', this._drawClippedContent.bind(this));
  this._bufferedView.on('drawUnclipped', this._drawUnclippedContent.bind(this));

  this._lastScrollState = null;
}

View.CONFIG_ATTRS = ['visualStyle', 'dataSource', 'splashScreen', 'loader1', 'loader2',
  'topMargin', 'bottomMargin', 'labelLeftMargin', 'labelRightMargin', 'labelColor',
  'labelFont', 'separatorColor', 'formatValue', 'roundValue', 'topLabelSpace',
  'minSpacing', 'maxSpacing', 'emphasizeRight'];

View.DEFAULTS = {
  topMargin: 20,
  bottomMargin: 5,
  labelLeftMargin: 10,
  labelRightMargin: 10,
  labelColor: '#999',
  labelFont: '16px sans-serif',
  separatorColor: '#f0f0f0',
  topLabelSpace: 0,
  minSpacing: 30,
  maxSpacing: 70,
  emphasizeRight: true
};

View.prototype = Object.create(EventEmitter.prototype);
View.prototype.constructor = View;

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
  if (this._lastScrollState !== null) {
    return this._lastScrollState;
  } else {
    return new window.scrollerjs.State(0, 0, 0);
  }
};

View.prototype.setScrolledPixels = function(p) {
  if (!this._headlessView.shouldShowContent()) {
    this.emit('scrollStateChange');
    return;
  }
  this._headlessView.setScrolledPixels(p);
  this._updateView(false);
};

View.prototype.setAnimate = function(a) {
  this._headlessView.setAnimate(a);
  this._bufferedView.setAnimate(a);
};

View.prototype.pointerMove = function(pos) {
  this._bufferedView.pointerMove(pos);
};

View.prototype.pointerLeave = function() {
  this._bufferedView.pointerLeave();
};

View.prototype.pointerClick = function(pos) {
  this._bufferedView.pointerClick(pos);
};

// _drawClippedContent can be overridden in subclasses to draw things like x-axis labels.
// The info object will be an object with two attributes, "viewport" and "report".
// Unlike in _drawUnclippedContent(), the context will be clipped to a region which
// contains the current chunk. Also unlike _drawUnclippedContent, this will only be
// called if some content was drawn.
View.prototype._drawClippedContent = function(info) {
};

// _drawUnclippedContent can be overridden in a subclass to draw additional content.
// The info object will either be null, or an object like the one passed to
// _drawClippedContent(). If it is null, it signifies that no content is visible.
View.prototype._drawUnclippedContent = function(info) {
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
    if (this._bufferedView.showingSplash() && this._lastScrollState) {
      this._lastScrollState = null;
      scrollStateChange = true;
    }
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
      dataSource.isLoadingChunk(HeadlessView.CURRENT_CHUNK) ||
      this._headlessView.shouldShowContent()) {
    this._config.splashScreen.showLoading();
  } else {
    this._config.splashScreen.showError();
  }
};

exports.View = View;
