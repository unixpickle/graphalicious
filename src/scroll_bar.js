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

ScrollBar.prototype.element = function() {
  return this._element;
};

ScrollBar.prototype.getAmountScrolled = function() {
  return this._amountScrolled;
};

ScrollBar.prototype.getKnobSize = function() {
  return this._knobSize;
};

ScrollBar.prototype.setAmountScrolled = function(fraction) {
  this._amountScrolled = fraction;
  var maxX = 1 - this._knobSize;
  this._knob.style.left = fractionToPercentString(maxX * fraction);
};

Scrollbar.prototype.setKnobSize = function(fraction) {
  this._knobSize = fraction;
  this._knob.style.width = fractionToPercentString(fraction);
  this.setAmountScrolled(this._amountScrolled);
};

function fractionToPercentString(fraction) {
  return (fraction*100).toFixed(5) + '%';
}
