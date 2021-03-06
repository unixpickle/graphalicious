//deps includes.js

function Label(attrs) {
  setPrivateAttributeVariables(this, attrs, Label.KEYS, {width: null});
}

Label.KEYS = ['text', 'value', 'opacity', 'font', 'color', 'width'];
Label._widthContext = document.createElement('canvas').getContext('2d');

defineAttributeGetters(Label.prototype, Label.KEYS);

Label.prototype.getWidth = function() {
  if (this._width === null) {
    Label._widthContext.font = this.getFont();
    this._width = Label._widthContext.measureText(this.getText()).width;
  }
  return this._width;
};

Label.prototype.equals = function(l) {
  for (var i = 0, len = Label.KEYS.length; i < len; ++i) {
    var key = Label.KEYS[i];
    if (key === 'width') {
      continue;
    }
    if (this['_' + key] !== l['_' + key]) {
      return false;
    }
  }
  return true;
};

Label.prototype.draw = function(ctx, x, y) {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = this.getFont();
  ctx.fillStyle = this.getColor();

  var oldAlpha = ctx.globalAlpha;
  ctx.globalAlpha *= this.getOpacity();

  ctx.fillText(this.getText(), x, y);

  ctx.globalAlpha = oldAlpha;
};

Label.prototype.copyWithOpacity = function(opacity) {
  var attrs = {};
  for (var i = 0, len = Label.KEYS.length; i < len; ++i) {
    var key = Label.KEYS[i];
    attrs[key] = this['_' + key];
  }
  attrs.opacity = opacity;
  return new Label(attrs);
};

function Labels(attrs) {
  setPrivateAttributeVariables(this, attrs, Labels.KEYS, {width: null});
}

Labels.KEYS = ['labelList', 'maxValue', 'topY', 'bottomY', 'width', 'leftMargin',
  'rightMargin'];

Labels.createLabels = function(config, viewHeight, maxValue) {
  var usableHeight = viewHeight - (config.topMargin + config.bottomMargin);
  if (usableHeight <= config.topLabelSpace) {
    return new Labels([], 0, 0, 0);
  }

  var fractionOverMax = config.topLabelSpace / usableHeight;
  var realMax = maxValue / (1 - fractionOverMax);
  var count = Math.floor(usableHeight / config.minSpacing);

  var division = config.roundValue(realMax / count);
  while (count > 2 && division*(count-1) >= realMax &&
         usableHeight/(count-2) <= config.maxSpacing) {
    --count;
  }

  var labelList = [];
  for (var i = 0; i <= count; ++i) {
    var labelValue = division * i;
    var labelText = config.formatValue(labelValue);
    var label = new Label({
      text: labelText,
      value: labelValue,
      opacity: 1,
      font: config.labelFont,
      color: config.labelColor
    });
    labelList.push(label);
  }

  return new Labels({
    labelList: labelList,
    maxValue: division * count,
    topY: config.topMargin,
    bottomY: viewHeight - config.bottomMargin,
    leftMargin: config.labelLeftMargin,
    rightMargin: config.labelRightMargin
  });
};

defineAttributeGetters(Labels.prototype, Labels.KEYS);

Labels.prototype.getWidth = function() {
  if (this._width === null) {
    this._width = 0;
    for (var i = 0, len = this._labelList.length; i < len; ++i) {
      this._width = Math.max(this._width, this._labelList[i].getWidth());
    }
  }
  return this._width;
};

Labels.prototype.equals = function(l) {
  for (var i = 0, len = Labels.KEYS.length; i < len; ++i) {
    var key = Labels.KEYS[i];
    if (key === 'labelList' || key === 'width') {
      continue;
    }
    if (this['_' + key] !== l['_' + key]) {
      return false;
    }
  }

  for (var i = 0, len = this._labelList.length; i < len; ++i) {
    if (!this._labelList[i].equals(l._labelList[i])) {
      return false;
    }
  }

  return true;
};

Labels.prototype.totalWidth = function() {
  return this.getWidth() + this._leftMargin + this._rightMargin;
};

Labels.prototype.draw = function(ctx) {
  var w = this.getWidth();
  for (var i = 0, len = this._labelList.length; i < len; ++i) {
    var label = this._labelList[i];
    var x = this._leftMargin + (w / 2);
    var y = this.yForLabel(i);
    label.draw(ctx, x, y);
  }
};

Labels.prototype.transitionFrame = function(end, fractionDone) {
  if (this.equals(end)) {
    return this;
  }

  var attrs = {};

  var numericalKeys = ['maxValue', 'topY', 'bottomY', 'leftMargin',
    'rightMargin', 'width'];
  for (var i = 0, len = numericalKeys.length; i < len; ++i) {
    var key = numericalKeys[i];
    var oldVal, newVal;
    if (key === 'width') {
      oldVal = this.getWidth();
      newVal = end.getWidth();
    } else {
      oldVal = this['_' + key];
      newVal = end['_' + key];
    }
    var val = (1-fractionDone)*oldVal + fractionDone*newVal;
    attrs[key] = val;
  }

  var labels = [];
  for (var i = 0, len = this._labelList.length; i < len; ++i) {
    var label = this._labelList[i].copyWithOpacity(1 - fractionDone);
    labels.push(label);
  }
  for (var i = 0, len = end._labelList.length; i < len; ++i) {
    var label = end._labelList[i].copyWithOpacity(fractionDone);
    labels.push(label);
  }

  attrs.labelList = labels;

  return new Labels(attrs);
};

Labels.prototype.getCount = function() {
  return this._labelList.length;
};

Labels.prototype.yForLabel = function(i) {
  var value = this._labelList[i].getValue();
  var pct = value / this._maxValue;
  var height = (this._bottomY - this._topY) * pct;
  return this._bottomY - height;
};

Labels.prototype.opacityForLabel = function(i) {
  return this._labelList[i].getOpacity();
};
