//deps event_emitter.js

function ScrollView(canvas, colorScheme) {
  this._canvas = canvas;
  this._colorScheme = colorScheme;
  
  this._animationStart = null;
  this._animationFrame = null;
  this._scrolls = false;
  
  this._offscreenWidth = 0;
  this._contentWidth = 0;
  this._pixelsScrolled = 0;
}

ScrollView.ANIMATION_DURATION = 0.4;
ScrollView.BAR_BG = '#ccc';
ScrollView.BAR_MIN_WIDTH = 20;
ScrollView.BAR_HEIGHT = 5;
ScrollView.BAR_SPACING = 5;

ScrollView.prototype = Object.create(EventEmitter.prototype);

// TODO: implement the rest of this.
