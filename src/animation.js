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
  this._progress = 0;
}

Animation.prototype = Object.create(EventEmitter.prototype);

Animation.prototype.cancel = function() {
  this._cancelled = true;
};

Animation.prototype.progress = function() {
  return this._progress;
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
  if (elapsed >= this._duration) {
    this._progress = 1;
  } else {
    this._progress = (elapsed / this._duration);
  }
  this.emit('progress', this._progress);

  if (this._progress < 1) {
    requestAnimationFrame(this._tick.bind(this));
  } else {
    this.emit('done');
  }
};

function ValueAnimation(duration, initial, final) {
  Animation.prototype.call(duration);
  this._initial = initial;
  this._final = final;
}

ValueAnimation.prototype = Object.create(Animation.prototype);

ValueAnimation.prototype.value = function() {
  return this._initial + (this._final-this._initial)*this._progress;
};
