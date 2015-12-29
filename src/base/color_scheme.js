// ColorScheme manages the colors of the graph.
// This is an EventEmitter and will emit 'change' events when it is updated.
function ColorScheme(primary, secondary) {
  window.EventEmitter.call(this);
  this._primary = primary;
  this._secondary = secondary;
}

ColorScheme.prototype = Object.create(window.EventEmitter.prototype);
ColorScheme.prototype.constructor = ColorScheme;

ColorScheme.prototype.getPrimary = function() {
  return this._primary;
};

ColorScheme.prototype.getSecondary = function() {
  return this._secondary;
};

ColorScheme.prototype.update = function(primary, secondary) {
  this._primary = primary;
  this._secondary = secondary;
  this.emit('change');
};

exports.ColorScheme = ColorScheme;
