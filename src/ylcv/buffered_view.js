//deps includes.js

// BufferedView draws the ChunkView and the labels, shows the loaders,
// and presents the splash screen for a YLCV.
//
// This view makes sure that the splash screen never appears for too short a time period,
// and provides a grace period for new content to load after old content is invalidated.
function BufferedView(config) {
  EventEmitter.call(this);

  this._splashScreen = config.splashScreen;
  this._leftLoader = config.loader1;
  this._rightLoader = config.loader2;
  this._visualStyle = config.visualStyle;

  this._element = document.createElement('div');
  this._canvas = document.createElement('canvas');

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
  this._yLabels = null;

  this._currentCursorPosition = null;
  this._registerPointerEvents();

  this._boundDraw = this.draw.bind(this);
  this._visualStyle.on('superficialChange', this._boundDraw);
}

BufferedView.STATE_SPLASH = 0;
BufferedView.STATE_EPHEMERAL_SPLASH = 1;
BufferedView.STATE_CONTENT = 2;
BufferedView.STATE_EPHEMERAL_CONTENT = 3;

BufferedView.EPHEMERAL_CONTENT_TIME = 100;
BufferedView.EPHEMERAL_SPLASH_TIME = 300;

BufferedView.prototype = Object.create(EventEmitter.prototype);

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

// draw draws the ContentView and the labels and positions the loaders.
BufferedView.prototype.draw = function() {
  if (this._state !== BufferedView.STATE_CONTENT || this._context === null) {
    return;
  }
  this._context.clearRect(0, 0, this._width, this._height);
  if (this._yLabels !== null) {
    this._yLabels.draw(this._context);
  }
  // TODO: draw the content, the y-axis lines, and position the loaders.
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

BufferedView.prototype._registerPointerEvents = function() {
  this._element.addEventListener('mousemove', function(e) {
    var rect = this._element.getBoundingClientRect();
    this._currentCursorPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    if (this._chunkView !== null) {
      this._chunkView.pointerMove(this._currentCursorPosition);
    }
  }.bind(this));

  this._element.addEventListener('mouseleave', function(e) {
    if (this._currentCursorPosition !== null) {
      this._currentCursorPosition = null;
      if (this._chunkView !== null) {
        this._chunkView.pointerLeave();
      }
    }
  }.bind(this));

  this._element.addEventListener('click', function(e) {
    if (this._chunkView !== null) {
      var rect = this._element.getBoundingClientRect();
      var pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      this._chunkView.pointerClick(pos);
    }
  }.bind(this));
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
