// ScrollBar is a DOM-based scrollbar.
function ScrollBar() {
  this._element = document.createElement('div');
  this._element.className = 'graphalicious-scrollbar';
  this._element.style.height = ScrollBar.HEIGHT + 'px';
  this._element.style.width = '100%';
  this._element.style.position = 'absolute';
  this._element.style.bottom = '0';

  this._knob = document.createElement('div');
  this._knob.className = 'graphalicious-scrollbar-knob';
  this._knob.style.height = '100%';
  this._knob.style.position = 'absolute';

  this._element.appendChild(this._knob);

  this._knobSize = 0.5;
  this._knob.style.width = '50%';

  this._amountScrolled = 1;
}

ScrollBar.HEIGHT = 5;

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

// setAmountScrolled can be understood by seeing getAmountScrolled.
ScrollBar.prototype.setAmountScrolled = function(fraction) {
  this._amountScrolled = fraction;
  var maxX = 1 - this._knobSize;
  this._knob.style.left = fractionToPercentString(maxX * fraction);
};

// setKnobSize can be understood by seeing getKnobSize.
ScrollBar.prototype.setKnobSize = function(fraction) {
  this._knobSize = fraction;
  this._knob.style.width = fractionToPercentString(fraction);
  this.setAmountScrolled(this._amountScrolled);
};
