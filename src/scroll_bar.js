// ScrollBar is a DOM-based scrollbar.
function ScrollBar() {
  EventEmitter.call(this);

  this._element = document.createElement('div');
  this._element.className = 'graphalicious-scrollbar';
  this._element.style.height = ScrollBar.HEIGHT + 'px';
  this._element.style.width = '100%';
  this._element.style.position = 'absolute';
  this._element.style.bottom = '0';
  this._element.style.backgroundColor = ScrollBar.DEFAULT_BACKGROUND_COLOR;

  this._knob = document.createElement('div');
  this._knob.className = 'graphalicious-scrollbar-knob';
  this._knob.style.height = '100%';
  this._knob.style.minWidth = ScrollBar.KNOB_MIN_WIDTH;
  this._knob.style.position = 'absolute';
  this._knob.style.backgroundColor = ScrollBar.DEFAULT_COLOR;

  this._element.appendChild(this._knob);

  this._knobSize = 0.5;
  this._amountScrolled = 1;
  this.setKnobSize(0.5);
  this.setAmountScrolled(1);

  this._registerEvents();
}

ScrollBar.DEFAULT_BACKGROUND_COLOR = '#ccc';
ScrollBar.DEFAULT_COLOR = '#65bcd4';
ScrollBar.HEIGHT = 5;
ScrollBar.KNOB_MIN_WIDTH = 10;

ScrollBar.prototype = Object.create(EventEmitter.prototype);

// element returns the ScrollBar's underlying DOM element.
ScrollBar.prototype.element = function() {
  return this._element;
};

// getAmountScrolled returns a number between 0 and 1 representing the percentage to which the user
// has scrolled in the content.
ScrollBar.prototype.getAmountScrolled = function() {
  return this._amountScrolled;
};

// getKnobSize returns a number between 0 and 1 representing the ratio of the size of the knob to
// the size of the scrollbar as a whole.
ScrollBar.prototype.getKnobSize = function() {
  return this._knobSize;
};

// layout should be called whenever the ScrollBar changes sizes.
ScrollBar.prototype.layout = function() {
  var elementWidth = this._element.offsetWidth;
  if (elementWidth === 0) {
    return;
  }
  var knobWidth = this._knobWidth();
  this._knob.style.width = formatPixels(knobWidth);

  var availableWidth = elementWidth - knobWidth;
  this._knob.style.left = formatPixels(availableWidth * this._amountScrolled);
};

// setAmountScrolled can be understood by seeing getAmountScrolled.
ScrollBar.prototype.setAmountScrolled = function(fraction) {
  this._amountScrolled = fraction;
  this.layout();
};

// setKnobSize can be understood by seeing getKnobSize.
ScrollBar.prototype.setKnobSize = function(fraction) {
  this._knobSize = fraction;
  this.layout();
};

ScrollBar.prototype._amountScrolledForWidth = function(w) {
  var elementWidth = this._element.offsetWidth;
  if (elementWidth === 0) {
    throw new Error('element is impossibly thin');
  }
  return (w / (elementWidth - this._knobWidth()));
};

ScrollBar.prototype._jumpPages = function(count) {
  var pageSize = 1 / ((1/this._knobSize)-1);
  var newAmount = this.getAmountScrolled() + count*pageSize;
  this.setAmountScrolled(Math.min(Math.max(newAmount, 0), 1));
  this.emit('change');
};

ScrollBar.prototype._knobWidth = function() {
  return Math.max(this._element.offsetWidth * this._knobSize, ScrollBar.KNOB_MIN_WIDTH);
};

ScrollBar.prototype._registerEvents = function() {
  var clicked = false;
  var initialX, initialAmountScrolled;

  var shielding = document.createElement('div');
  shielding.style.position = 'fixed';
  shielding.style.left = '0';
  shielding.style.top = '0';
  shielding.style.width = '100%';
  shielding.style.height = '100%';

  this._element.addEventListener('mousedown', function(e) {
    var pos = e.clientX;
    var knobRect = this._knob.getBoundingClientRect();
    if (pos < knobRect.left) {
      this._jumpPages(-1);
    } else if (pos > knobRect.left+knobRect.width) {
      this._jumpPages(1);
    } else {
      clicked = true;
      initialX = pos;
      initialAmountScrolled = this.getAmountScrolled();

      // NOTE: this prevents hover events on the left of the page while dragging.
      document.body.appendChild(shielding);

      // NOTE: this line of code prevents the cursor from changing on drag in Safari on OS X.
      // It may have the same effect on other platforms as well.
      e.preventDefault();
    }
  }.bind(this));

  document.body.addEventListener('mouseup', function() {
    if (clicked) {
      clicked = false;
      document.body.removeChild(shielding);
    }
  });

  document.body.addEventListener('mousemove', function(e) {
    if (clicked) {
      var xOffset = e.clientX - initialX;
      var amount = initialAmountScrolled + this._amountScrolledForWidth(xOffset);
      this.setAmountScrolled(Math.min(Math.max(amount, 0), 1));
      this.emit('change');
    }
  }.bind(this));
};
