// ScrollBar implements a user-controlled scrollbar.
// This will emit a 'change' event whenever the bar is scrolled.
function ScrollBar(colorScheme) {
  EventEmitter.call(this);

  this._track = document.createElement('div');
  this._track.style.backgroundColor = ScrollBar.TRACK_COLOR;
  this._track.style.width = '100%';
  this._track.style.height = '0px';
  this._track.style.position = 'absolute';
  this._track.style.bottom = '0';

  this._thumb = document.createElement('div');
  this._thumb.style.height = '100%';
  this._thumb.style.position = 'absolute';
  this._track.appendChild(this._thumb);

  this._thumb.style.backgroundColor = colorScheme.getPrimary();
  colorScheme.on('change', function() {
    this._thumb.style.backgroundColor = colorScheme.getPrimary();
  }.bind(this));

  this._totalPixels = 0;
  this._visiblePixels = 0;
  this._scrolledPixels = 0;

  this._trackWidth = 0;
  this._thumbWidth = 0;
  this._thumbLeft = 0;

  this._moveEventCallback = null;
  this._registerMouseEvents();
  this._registerTouchEvents();
}

ScrollBar.THUMB_MIN_WIDTH = 20;
ScrollBar.TRACK_COLOR = '#ccc';

ScrollBar.prototype = Object.create(EventEmitter.prototype);

ScrollBar.prototype.element = function() {
  return this._track;
};

ScrollBar.prototype.layout = function(width, height) {
  if (width < ScrollBar.THUMB_MIN_WIDTH) {
    return;
  }

  this._track.style.height = height.toFixed(2) + 'px';
  this._track.style.width = width;

  this._trackWidth = width;
  this._updateThumb();
};

ScrollBar.prototype.getScrolledPixels = function() {
  return this._scrolledPixels;
};

ScrollBar.prototype.setInfo = function(total, visible, scrolled) {
  this._totalPixels = total;
  this._visiblePixels = visible;
  this._scrolledPixels = scrolled;
  this._updateThumb();
};

ScrollBar.prototype._updateThumb = function(width) {
  this._thumbWidth = this._trackWidth * (this._visiblePixels / this._totalPixels);
  if (this._thumbWidth < ScrollBar.THUMB_MIN_WIDTH) {
    this._thumbWidth = ScrollBar.THUMB_MIN_WIDTH;
  }

  var usableWidth = this._trackWidth - this._thumbWidth;
  var percentScrolled = this._scrolledPixels / (this._totalPixels - this._visiblePixels);
  this._thumbLeft = usableWidth * percentScrolled;

  this._thumb.style.width = Math.round(this._thumbWidth) + 'px';
  this._thumb.style.left = Math.round(this._thumbLeft) + 'px';
};

ScrollBar.prototype._eventBegan = function(startX) {
  var scrollablePixels = this._totalPixels - this._visiblePixels;
  var maxThumbLeft = this._trackWidth - this._thumbWidth;

  var startThumbLeft = this._thumbLeft;
  if (startX < startThumbLeft || startX > startThumbLeft + this._thumbWidth) {
    startThumbLeft = Math.min(maxThumbLeft, Math.max(0, startX-this._thumbWidth/2));
  }

  this._moveEventCallback = function(x) {
    var xOffset = x - startX;
    var newThumbLeft = Math.min(maxThumbLeft, Math.max(0, startThumbLeft + xOffset));
    var ratioScrolled = newThumbLeft / maxThumbLeft;
    this._scrolledPixels = Math.round(scrollablePixels * ratioScrolled);
    this._updateThumb();
    this.emit('change');
  }.bind(this);
  this._moveEventCallback(startX);
};

ScrollBar.prototype._registerMouseEvents = function() {
  var shielding = document.createElement('div');
  shielding.style.width = '100%';
  shielding.style.height = '100%';
  shielding.style.position = 'fixed';

  var mouseMove, mouseUp;

  mouseMove = function(e) {
    if (this._moveEventCallback !== null) {
      this._moveEventCallback(e.clientX);

      // NOTE: this fixes a problem where the cursor becomes an ibeam.
      e.preventDefault();
      e.stopPropagation();
    }
  }.bind(this);

  mouseUp = function() {
    if (this._moveEventCallback !== null) {
      this._moveEventCallback = null;
      document.body.removeChild(shielding);
    }
    window.removeEventListener('mousemove', mouseMove);
    window.removeEventListener('mouseup', mouseUp);
  }.bind(this);

  this._track.addEventListener('mousedown', function(e) {
    if (this._moveEventCallback) {
      return;
    }

    // NOTE: this fixes a problem where the cursor becomes an ibeam.
    e.preventDefault();
    e.stopPropagation();

    this._eventBegan(e.clientX);
    document.body.appendChild(shielding);

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
  }.bind(this));
};

ScrollBar.prototype._registerTouchEvents = function() {
  var e = this._track;

  e.addEventListener('touchstart', function(e) {
    this._eventBegan(e.changedTouches[0].clientX);
  }.bind(this));

  e.addEventListener('touchmove', function(e) {
    if (this._moveEventCallback) {
      this._moveEventCallback(e.changedTouches[0].clientX);
    }
  }.bind(this));

  var cancel = function() {
    this._moveEventCallback = null;
  }.bind(this);

  e.addEventListener('touchend', cancel);
  e.addEventListener('touchcancel', cancel);
};
