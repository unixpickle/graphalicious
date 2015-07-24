// TODO: implement lag-smoothing.

var currentTimestamp = window.performance.now || function() {
  return new Date().getTime();
};

var requestAnimationFrame = window.requestAnimationFrame || function(cb) {
  setTimeout(function() {
    cb(currentTimestamp);
  }, 1000/60);
};

// An Animation uses requestAnimationFrame or a polyfill to animate a percentage
// over a given duration.
function Animation(duration) {
  this._duration = duration * 1000;
  this._startTime = null;
  this._cancelled = false;
}

Animation.prototype = Object.create(EventEmitter.prototype);

Animation.prototype.cancel = function() {
  this._cancelled = true;
};

Animation.prototype.progress = function() {
  var elapsed = currentTimestamp() - this._startTime;
  return Math.max(Math.min(elapsed/this._duration, 1), 0);
};

Animation.prototype.start = function() {
  if (this._startTime !== null) {
    throw new Error('cannot restart animation');
  }
  this._startTime = currentTimestamp();
  requestAnimationFrame(this._tick.bind(this));
};

Animation.prototype._tick = function(ts) {
  if (this._cancelled) {
    return;
  }

  var elapsed = ts - this._startTime;
  var progress = (elapsed / this._duration);
  var done = false;
  if (elapsed >= this._duration) {
    done = true;
    progress = 1;
  }
  this.emit('progress', progress);
  if (!done) {
    requestAnimationFrame(this._tick.bind(this));
  } else {
    this.emit('done');
  }
};
