//deps event_emitter.js

// A ColorScheme can be used to suggest colors to various graph types.
//
// ColorScheme implements EventEmitter and will emit 'change' events whenever it is changed.
function ColorScheme(primaryColor, secondaryColor) {
  EventEmitter.call(this);
  this._primaryColor = primaryColor;
  this._secondaryColor = secondaryColor || primaryColor;
}

ColorScheme.prototype = Object.create(EventEmitter.prototype);

// getPrimaryColor returns the primary color of the color scheme.
ColorScheme.prototype.getPrimaryColor = function() {
  return this._primaryColor;
};

// getSecondaryColor returns the secondary color of the color scheme.
ColorScheme.prototype.getSecondaryColor = function() {
  return this._secondaryColor;
};

// setColors updates the primary and secondary colors of the ColorScheme.
ColorScheme.prototype.setColors = function(prim, sec) {
  this._primaryColor = prim;
  this._secondaryColor = sec || prim;
  this.emit('change');
};

exports.ColorScheme = ColorScheme;
