//deps includes.js

// BufferedView draws the ChunkView and the labels, shows the loaders,
// and presents the splash screen for a YLCV.
//
// This view makes sure that the splash screen never appears for too short a time period,
// and provides a grace period for new content to load after old content is invalidated.
function BufferedView(config) {
  EventEmitter.call(this);

  this._separatorColor = config.separatorColor;
  this._splashScreen = config.splashScreen;
  this._leftLoader = config.loader1;
  this._rightLoader = config.loader2;
  this._visualStyle = config.visualStyle;

  this._element = document.createElement('div');
  this._canvas = document.createElement('canvas');
  this._canvas.style.pointerEvents = 'none';

  this._element.appendChild(this._splashScreen.element());

  var elements = [this._canvas, this._element, this._splashScreen.element()];
  makeElementsFillAndAbsolute(elements);

  this._width = 0;
  this._height = 0;

  this._context = null;
  this._pixelRatio = 0;
  this._crystalCallback = this._updatePixelRatio.bind(this, true);

  this._animate = false;
  this._state = BufferedView.STATE_SPLASH;
  this._splashStartTime = 0;
  this._timeout = null;

  this._chunkViewOffset = 0;
  this._chunkView = null;
  this._chunkViewMargins = null;
  this._yLabels = null;

  this._currentCursorPosition = null;

  this._boundDraw = this.draw.bind(this);
  this._visualStyle.on('superficialChange', this._boundDraw);
}

BufferedView.STATE_SPLASH = 0;
BufferedView.STATE_EPHEMERAL_SPLASH = 1;
BufferedView.STATE_CONTENT = 2;
BufferedView.STATE_EPHEMERAL_CONTENT = 3;

BufferedView.EPHEMERAL_CONTENT_TIME = 100;
BufferedView.EPHEMERAL_SPLASH_TIME = 300;

BufferedView.ZIGZAG_WIDTH = 8;
BufferedView.LINE_WIDTH = 2;

BufferedView.prototype = Object.create(EventEmitter.prototype);
BufferedView.prototype.constructor = BufferedView;

// element returns the root DOM element of the view.
BufferedView.prototype.element = function() {
  return this._element;
};

// dispose removes any registered event listeners on the ChunkView and VisualStyle.
BufferedView.prototype.dispose = function() {
  if (this._chunkView) {
    this._chunkView.removeListener('redraw', this._boundDraw);
  }
  this._visualStyle.removeListener('superficialChange', this._boundDraw);
};

// context returns the 2D drawing context for the view's canvas.
// This may return null if the view is not visible.
BufferedView.prototype.context = function() {
  return this._context;
};

// layout updates the size of the BufferedView.
//
// You should manually call draw() after calling this.
BufferedView.prototype.layout = function(w, h) {
  w = Math.ceil(w);
  h = Math.ceil(h);

  if (this._width === w && this._height === h) {
    return;
  }

  this._width = Math.ceil(w);
  this._height = Math.ceil(h);

  this._element.style.width = this._width + 'px';
  this._element.style.height = this._height + 'px';

  this._updateCanvasSize();
  this._splashScreen.layout(this._width, this._height);

  if (this._state === BufferedView.STATE_EPHEMERAL_CONTENT) {
    clearTimeout(this._timeout);
    this._showSplashScreen();
  }
};

// getAnimate returns the animate flag, as described in setAnimate().
BufferedView.prototype.getAnimate = function() {
  return this._animate;
};

// setAnimate toggles the animate flag.
// If the animate flag is set, then the loaders and splash screen will animate.
// While the animate flag is set, the view listens for DPI changes.
BufferedView.prototype.setAnimate = function(flag) {
  if (flag === this._animate) {
    return;
  }
  this._animate = flag;
  if (flag) {
    window.crystal.addListener(this._crystalCallback);
    this._updatePixelRatio(false);
    if (this._state === BufferedView.STATE_SPLASH ||
        this._state === BufferedView.STATE_EPHEMERAL_SPLASH) {
      this._splashScreen.setAnimate(true);
    } else {
      this.draw();
    }
  } else {
    window.crystal.removeListener(this._crystalCallback);
    this._splashScreen.setAnimate(false);
    this._leftLoader.setAnimate(false);
    this._rightLoader.setAnimate(false);
  }
};

// getChunkView returns the current chunk view, or null if no chunk view is associated with this.
BufferedView.prototype.getChunkView = function() {
  return this._chunkView;
};

// setChunkView changes the ChunkView that this view uses to draw.
// You may pass null to indicate that there is no available ChunkView.
//
// You should manually call draw() after calling this.
BufferedView.prototype.setChunkView = function(cv) {
  if (this._chunkView === cv) {
    return;
  }

  if (this._chunkView !== null) {
    this._chunkView.removeListener('redraw', this._boundDraw);
    if (cv) {
      cv.handoff(this._chunkView);
    }
  }

  this._chunkView = cv;

  if (cv === null) {
    switch (this._state) {
    case BufferedView.STATE_SPLASH:
    case BufferedView.STATE_EPHEMERAL_CONTENT:
      break;
    case BufferedView.STATE_CONTENT:
      this._state = BufferedView.STATE_EPHEMERAL_CONTENT;
      this._timeout = setTimeout(this._showSplashScreen.bind(this),
        BufferedView.EPHEMERAL_CONTENT_TIME);
      break;
    case BufferedView.STATE_EPHEMERAL_SPLASH:
      this._state = BufferedView.STATE_SPLASH;
      clearTimeout(this._timeout);
      this._timeout = null;
      break;
    }
  } else {
    switch (this._state) {
    case BufferedView.STATE_EPHEMERAL_SPLASH:
      break;
    case BufferedView.STATE_SPLASH:
      var splashTime = Math.max(0, new Date().getTime()-this._splashStartTime);
      if (splashTime < BufferedView.EPHEMERAL_SPLASH_TIME) {
        this._state = BufferedView.STATE_EPHEMERAL_SPLASH;
        this._timeout = setTimeout(this._showContent.bind(this),
          BufferedView.EPHEMERAL_SPLASH_TIME-splashTime);
      } else {
        this._showContent();
      }
      break;
    case BufferedView.STATE_EPHEMERAL_CONTENT:
      this._state = BufferedView.STATE_CONTENT;
      clearTimeout(this._timeout);
      this._timeout = null;
      /* falls through */
    case BufferedView.STATE_CONTENT:
      if (this._currentCursorPosition !== null) {
        this._chunkView.pointerMove(this._currentCursorPosition);
      }
      break;
    }
    cv.on('redraw', this._boundDraw);
  }
};

// getChunkViewOffset returns the scroll offset minus the leftmost label width.
BufferedView.prototype.getChunkViewOffset = function() {
  return this._chunkViewOffset;
};

// setChunkViewOffset changes the scroll offset.
//
// You should manually call draw() after calling this.
BufferedView.prototype.setChunkViewOffset = function(val) {
  this._chunkViewOffset = val;
};

// setChunkViewMargins tells the view how many data points are before
// and after the current chunk.
//
// You should manually call draw() after calling this.
BufferedView.prototype.setChunkViewMargins = function(val) {
  this._chunkViewMargins = val;
};

// getChunkViewMargins returns the scroll offset minus the leftmost label width.
BufferedView.prototype.getChunkViewMargins = function() {
  return this._chunkViewMargins;
};

// getYLabels returns the current y labels, used for drawing.
BufferedView.prototype.getYLabels = function() {
  return this._yLabels;
};

// setYLabels changes the current y labels.
//
// You should manually call draw() after calling this.
BufferedView.prototype.setYLabels = function(labels) {
  this._yLabels = labels;
};

// showingSplash returns true if the splash screen is actively showing.
// If the content is visible, even ephemerally, this returns false.
BufferedView.prototype.showingSplash = function() {
  return this._state === BufferedView.STATE_EPHEMERAL_SPLASH ||
    this._state === BufferedView.STATE_SPLASH;
};

// pointerMove forwards pointer movements to the ChunkView.
BufferedView.prototype.pointerMove = function(pos) {
  this._currentCursorPosition = pos;
  if (this._chunkView !== null) {
    this._chunkView.pointerMove(this._currentCursorPosition);
  }
};

// pointerLeave forwards pointer leave events to the ChunkView.
BufferedView.prototype.pointerLeave = function() {
  if (this._currentCursorPosition !== null) {
    this._currentCursorPosition = null;
    if (this._chunkView !== null) {
      this._chunkView.pointerLeave();
    }
  }
};

// pointerClick forwards click events to the ChunkView.
BufferedView.prototype.pointerClick = function(pos) {
  if (this._chunkView !== null) {
    this._chunkView.pointerClick(pos);
  }
};

// draw draws the ChunkView and the labels and positions the loaders.
BufferedView.prototype.draw = function() {
  if (this._state !== BufferedView.STATE_CONTENT || this._context === null) {
    this.emit('drawUnclipped', null);
    return;
  }
  assert(this._chunkView !== null);

  this._context.clearRect(0, 0, this._width, this._height);

  if (this._yLabels === null) {
    this._showFullscreenLoader();
    this.emit('drawUnclipped', null);
    return;
  }

  var yLabelWidth = this._yLabels.totalWidth();

  if (yLabelWidth+this._chunkView.getEncompassingWidth() <= this._width) {
    this._drawStretched(yLabelWidth);
    return;
  }

  var labelsOffset = 0;

  var chunkLeft = this._chunkView.getOffset() - this._chunkViewOffset - BufferedView.ZIGZAG_WIDTH;
  var chunkRight = chunkLeft + this._chunkView.getWidth() + BufferedView.ZIGZAG_WIDTH*2;

  if (chunkLeft > this._width-yLabelWidth) {
    labelsOffset = chunkLeft - (this._width - yLabelWidth);
  } else if (chunkRight < yLabelWidth) {
    labelsOffset = yLabelWidth - chunkRight;
  }

  if (labelsOffset > yLabelWidth) {
    labelsOffset = yLabelWidth;
  }

  this._context.save();
  this._context.translate(-labelsOffset, 0);
  this._yLabels.draw(this._context);
  this._context.translate(labelsOffset, 0);

  var viewport = {
    x: yLabelWidth - labelsOffset,
    y: this._yLabels.getTopY(),
    width: this._width - yLabelWidth + labelsOffset,
    height: this._yLabels.getBottomY() - this._yLabels.getTopY(),
    fullX: 0,
    fullY: 0,
    fullWidth: this._width,
    fullHeight: this._height - this._yLabels.getBottomY(),
    context: this._context
  };

  var offset = this._chunkViewOffset + viewport.x;
  var report = this._chunkView.draw(viewport, offset, this._yLabels.getMaxValue());

  this._context.beginPath();
  this._context.rect(viewport.x, 0, viewport.width, this._height);
  this._context.clip();

  this._clipWithZigzag(chunkLeft, chunkRight);
  this._drawLines();

  this._showLoaders(viewport.x, chunkLeft, chunkRight);

  var drawInfo = {viewport: viewport, report: report};
  this.emit('drawClipped', drawInfo);
  this._context.restore();
  this.emit('drawUnclipped', drawInfo);
};

BufferedView.prototype._drawStretched = function(yLabelWidth) {
  this._context.save();
  this._yLabels.draw(this._context);

  var viewport = {
    x: yLabelWidth,
    y: this._yLabels.getTopY(),
    width: this._width - yLabelWidth,
    height: this._yLabels.getBottomY() - this._yLabels.getTopY(),
    fullX: 0,
    fullY: 0,
    fullWidth: this._width,
    fullHeight: this._height,
    context: this._context
  };

  assert(Math.abs(this._chunkViewOffset + viewport.x) < 0.001);
  var report = this._chunkView.draw(viewport, 0, this._yLabels.getMaxValue());

  this._context.beginPath();
  this._context.rect(viewport.x, 0, viewport.width, this._height);
  this._context.clip();

  var chunkLeft = report.left - BufferedView.ZIGZAG_WIDTH/2;
  var chunkRight = report.left + report.width + BufferedView.ZIGZAG_WIDTH/2;

  if (this._chunkViewMargins.before === 0) {
    chunkLeft = -BufferedView.ZIGZAG_WIDTH;
  }
  if (this._chunkViewMargins.after === 0) {
    chunkRight = this._width+BufferedView.ZIGZAG_WIDTH;
  }

  this._clipWithZigzag(chunkLeft, chunkRight);
  this._drawLines();
  this._showLoaders(viewport.x, chunkLeft, chunkRight);

  var drawInfo = {viewport: viewport, report: report};
  this.emit('drawClipped', drawInfo);
  this._context.restore();
  this.emit('drawUnclipped', drawInfo);
};

BufferedView.prototype._showFullscreenLoader = function() {
  this._showLoaders(0, this._width, this._width);
};

BufferedView.prototype._showLoaders = function(viewportX, contentLeft, contentRight) {
  contentLeft = Math.min(this._width, contentLeft);
  contentRight = Math.max(viewportX, contentRight);

  if (contentLeft <= viewportX) {
    if (this._leftLoader.element().parentNode !== null) {
      this._element.removeChild(this._leftLoader.element());
      this._leftLoader.setAnimate(false);
    }
  } else {
    var e = this._leftLoader.element();
    if (e.parentNode === null) {
      this._element.insertBefore(e, this._canvas);
    }
    e.style.left = Math.round(viewportX) + 'px';
    e.style.top = '0';
    this._leftLoader.setAnimate(this._animate);
    this._leftLoader.layout(contentLeft-viewportX, this._height);
  }

  if (contentRight >= this._width) {
    if (this._rightLoader.element().parentNode !== null) {
      this._element.removeChild(this._rightLoader.element());
      this._rightLoader.setAnimate(false);
    }
  } else {
    var e = this._rightLoader.element();
    if (e.parentNode === null) {
      this._element.insertBefore(e, this._canvas);
    }
    e.style.left = Math.ceil(contentRight) + 'px';
    e.style.top = '0';
    this._rightLoader.setAnimate(this._animate);
    this._rightLoader.layout(this._width-contentRight, this._height);
  }
};

BufferedView.prototype._drawLines = function() {
  var oldComp = this._context.globalCompositeOperation;
  this._context.globalCompositeOperation = 'destination-over';
  this._context.strokeStyle = this._separatorColor;
  this._context.lineWidth = BufferedView.LINE_WIDTH;
  for (var i = 0, len = this._yLabels.getCount(); i < len; ++i) {
    var yValue = Math.round(this._yLabels.yForLabel(i));
    var opacity = this._yLabels.opacityForLabel(i);
    this._context.beginPath();
    this._context.moveTo(0, yValue);
    this._context.lineTo(this._width, yValue);
    this._context.stroke();
  }
  this._context.globalCompositeOperation = oldComp;
};

BufferedView.prototype._clipWithZigzag = function(left, right) {
  this._context.beginPath();
  this._strokeZigzag(left+BufferedView.ZIGZAG_WIDTH/2, true, true);
  this._strokeZigzag(right-BufferedView.ZIGZAG_WIDTH/2, false, false);
  this._context.closePath();

  var oldComp = this._context.globalCompositeOperation;
  this._context.globalCompositeOperation = 'destination-over';
  this._context.strokeStyle = this._separatorColor;
  this._context.lineWidth = BufferedView.LINE_WIDTH;
  this._context.stroke();
  this._context.globalCompositeOperation = oldComp;

  this._context.clip();
};

BufferedView.prototype._strokeZigzag = function(x, startTop, moveToFirst) {
  var zigSize = BufferedView.ZIGZAG_WIDTH - Math.sqrt(2)*BufferedView.LINE_WIDTH;

  var maxY = this._height + BufferedView.LINE_WIDTH;
  var minY = -BufferedView.LINE_WIDTH;

  var y = startTop ? minY : maxY;
  var step = startTop ? zigSize : -zigSize;
  while (true) {
    if (moveToFirst) {
      moveToFirst = false;
      this._context.moveTo(x-zigSize/2, y);
    } else {
      this._context.lineTo(x-zigSize/2, y);
    }
    y += step;
    this._context.lineTo(x+zigSize/2, y);
    if (y < minY || y > maxY) {
      break;
    }
    y += step;
  }
};

BufferedView.prototype._updatePixelRatio = function(redraw) {
  var newRatio = Math.ceil(window.crystal.getRatio());
  if (this._pixelRatio === newRatio) {
    return;
  }

  this._pixelRatio = newRatio;
  this._updateCanvasSize();

  if (redraw) {
    this.draw();
  }
};

BufferedView.prototype._updateCanvasSize = function() {
  this._canvas.width = this._width * this._pixelRatio;
  this._canvas.height = this._height * this._pixelRatio;
  this._canvas.style.width = this._width + 'px';
  this._canvas.style.height = this._height + 'px';
  this._context = this._canvas.getContext('2d');
  this._context.scale(this._pixelRatio, this._pixelRatio);
};

BufferedView.prototype._showSplashScreen = function() {
  this._timeout = null;
  this._state = BufferedView.STATE_SPLASH;

  this._splashStartTime = new Date().getTime();

  this._element.removeChild(this._canvas);
  if (this._leftLoader.element().parentNode) {
    this._element.removeChild(this._leftLoader.element());
  }
  if (this._rightLoader.element().parentNode) {
    this._element.removeChild(this._rightLoader.element());
  }

  this._element.appendChild(this._splashScreen.element());

  this.emit('change');
};

BufferedView.prototype._showContent = function() {
  this._timeout = null;
  this._state = BufferedView.STATE_CONTENT;

  this._element.removeChild(this._splashScreen.element());
  this._element.appendChild(this._canvas);

  this.draw();

  this.emit('change');
};

function makeElementsFillAndAbsolute(elements) {
  for (var i = 0, len = elements.length; i < len; ++i) {
    var s = elements[i].style;
    s.position = 'absolute';
    s.width = '100%';
    s.height = '100%';
    s.top = '0';
    s.left = '0';
  }
}
