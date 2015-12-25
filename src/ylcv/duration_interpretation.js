function DurationInterpretation(config) {
  this._divisions = config.divisions || DurationInterpretation.DEFAULT_DIVISIONS;
  if ('undefined' === typeof config.decimals) {
    this._decimals = DurationInterpretation.DEFAULT_DECIMALS;
  } else {
    this._decimals = config.decimals;
  }
}

DurationInterpretation.DEFAULT_DIVISIONS = [250, 1000, 5000, 10000, 20000, 30000, 60000];
DurationInterpretation.DEFAULT_DECIMALS = 2;

DurationInterpretation.prototype.round = function(x) {
  var value = -1;
  var error = Infinity;

  for (var i = 0, len = this._divisions.length; i < len; ++i) {
    // Avoid using divisions when larger divisions still give good granularity.
    if (i < len-1 && x > this._divisions[i+1]) {
      continue;
    }

    var division = this._divisions[i];
    var thisValue = division * Math.ceil(x / division);
    var thisError = thisValue - x;
    if (thisError < error) {
      value = thisValue;
      error = thisError;
    }
  }

  return value;
};

DurationInterpretation.prototype.format = function(value) {
  var decimalSuffix = durationDecimals(value, this._decimals);
  if (/^.0*$/.test(decimalSuffix)) {
    decimalSuffix = '';
  }

  var seconds = '' + (Math.floor(value/1000)%60);
  var minutes = '' + (Math.floor(value/60000)%60);
  var hours = '' + (Math.floor(value/3600000)%60);

  if (minutes === '0' && hours === '0') {
    return seconds + decimalSuffix;
  } else if (hours === '0') {
    return minutes + ':' + padZero(seconds) + decimalSuffix;
  } else {
    seconds = padZero(seconds);
    minutes = padZero(minutes);
    return hours + ':' + padZero(minutes) + ':' + padZero(seconds) + decimalSuffix;
  }
};

function padZero(s) {
  return s.length < 2 ? '0' + s : s;
}

// durationDecimals returns a string representing the sub-second
// component of a duration, including a leading '.'.
//
// For example, durationDecimals(123456, 2) would return '.45'.
//
// If digitCount is 0, this will not include a leading '.',
// since the sub-second part of the duration is ignored.
function durationDecimals(millis, digitCount) {
  if (digitCount === 0) {
    return '';
  }
  var pow = Math.pow(10, digitCount);
  var fractional = (millis / 1000).toFixed(digitCount + 1);
  return fractional.substr(0, 1+digitCount);
}

exports.DurationInterpretation = DurationInterpretation;
