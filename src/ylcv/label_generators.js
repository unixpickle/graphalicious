var DEFAULT_MIN_SPACING = 20;
var DEFAULT_TOP_MARGIN = 10;

// DurationLabelGenerator creates Labels for duration values like "1:50.50".
function DurationLabelGenerator(attrs) {
  this.divisions = attrs.divisions || DurationLabelGenerator.DEFAULT_DIVISIONS;
  this.decimalPlaces = attrs.decimalPlaces || DurationLabelGenerator.DEFAULT_DECIMAL_PLACES;
  this.minSpacing = attrs.minSpacing || DEFAULT_MIN_SPACING;
  this.topMargin = attrs.topMargin || DEFAULT_TOP_MARGIN;
  this.settings = attrs.settings || new LabelSettings({});
}

DurationLabelGenerator.DEFAULT_DIVISIONS = [250, 1000, 5000, 10000, 20000, 30000, 60000];
DurationLabelGenerator.DEFAULT_DECIMAL_PLACES = 2;

DurationLabelGenerator.prototype.createLabels = function(maxValue, height, settings) {
  var count = Math.floor(height / this.minSpacing);
  var maxValueForMargin = maxValue * height / (height - this.topMargin);
  var minDivision = maxValueForMargin / count;

  var division = -1;
  var error = Infinity;
  for (var i = 0, len = this.divisions.length; i < len; ++i) {
    // Avoid using divisions when larger divisions still give good granularity.
    if (i < len-1 && minDivision > this.divisions[i+1]) {
      continue;
    }

    var divisionFactor = this.divisions[i];
    var thisDivision = divisionFactor * Math.ceil(minDivision / divisionFactor);
    var thisError = thisDivision*count - maxValueForMargin;
    if (thisError < error) {
      division = thisDivision;
      error = thisError;
    }
  }

  var values = [];
  var text = [];
  for (var i = 0; i < count; ++i) {
    var labelValue = i*division;
    values[i] = labelValue;
    if (labelValue === 0) {
      text[i] = ''
    } else {
      if (labelValue % 1000 === 0) {
        text[i] = formatDuration(labelValue, 0);
      } else {
        text[i] = formatDuration(labelValue, this.decimalPlaces);
      }
    }
  }

  return new Labels(text, values, this.settings);
};

function formatDuration(millis, decimalPlaces) {
  var pow = Math.pow(10, decimalPlaces);
  var fractional = ((Math.floor(millis / 1000 * pow) % pow) / pow).toFixed(decimalPlaces).substr(1);
  var seconds = '' + (Math.floor(millis/1000)%60);
  var minutes = '' + (Math.floor(millis/60000)%60);
  var hours = '' + (Math.floor(millis/3600000)%60);
  if (minutes === '0' && hours === '0') {
    return seconds + fractional;
  } else if (hours === '0') {
    return minutes + ':' + padZero(seconds) + fractional;
  } else {
    seconds = padZero(seconds);
    minutes = padZero(minutes);
    return hours + ':' + padZero(minutes) + ':' + padZero(seconds) + fractional;
  }
}

function padZero(s) {
  return s.length < 2 ? '0' + s : s;
}

// IntegerLabelGenerator creates Labels for integer values.
function IntegerLabelGenerator(attrs, settings) {
  this.minSpacing = attrs.minSpacing || DEFAULT_MIN_SPACING;
  this.topMargin = attrs.topMargin || DEFAULT_TOP_MARGIN;
  this.settings = attrs.settings || new LabelSettings({});
}

IntegerLabelGenerator.prototype.createLabels = function(maxValue, height) {
  var count = Math.floor(height / this.minSpacing);
  var maxValueForMargin = maxValue * height / (height - this.topMargin);
  var division = Math.max(1, Math.ceil(maxValueForMargin / count));

  var values = [];
  var text = [];
  for (var i = 0; i < count; ++i) {
    var labelValue = i*division;
    values[i] = labelValue;
    if (labelValue === 0) {
      text[i] = ''
    } else {
      text[i] = '' + labelValue;
    }
  }

  return new Labels(text, values, this.settings);
};

exports.Labels = Labels;
exports.DurationLabelGenerator = DurationLabelGenerator;
exports.IntegerLabelGenerator = IntegerLabelGenerator;