//deps animation.js axis_label.js

// YAxisLabel is an AxisLabel with an extra value attribute.
function YAxisLabel(text, font, value) {
  AxisLabel.call(this, text, font);
  this.value = value;
}

YAxisLabel.prototype = Object.create(AxisLabel.prototype);

// copy creates a duplicate of this label.
YAxisLabel.prototype.copy = function() {
  var res = Object.create(YAxisLabel.prototype);
  res.text = this.text;
  res.opacity = this.opacity;
  res.font = this.font;
  res.value = this.value;
  return res;
};

// equals returns true if this label shares all the same properties as another one.
YAxisLabel.prototype.equals = function(a) {
  return AxisLabel.prototype.equals.call(this, a) && this.value === a.value;
};
