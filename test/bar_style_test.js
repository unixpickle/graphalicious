var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var fs = require('fs');
var BarStyleAttrs = (function() {
  var code = fs.readFileSync(__dirname + '/../src/styles/bar_style.js');
  code = '(function() {' + code + ';return BarStyleAttrs})()';
  return eval(code);
})();

function regionContains(bigger, smaller) {
  if (smaller.width === 0) {
    return true;
  }
  return bigger.left <= smaller.left && bigger.left+bigger.width >= smaller.left+smaller.width;
}

function testComputeRange() {
  var attrs = new BarStyleAttrs({
    leftMargin: 17,
    rightMargin: 19,
    barSpacing: 7,
    barWidth: 13
  });

  var totalWidth = 17 + 19 + 13*11 + 7*10;

  // These are arrays of the form [left, width, startIndex, length].
  var tests = [
    [0, 1, 0, 1],
    [0, 17+13, 0, 1],
    [0, 17+13+6, 0, 1],
    [0, 17+13+7, 0, 1],
    [0, 17+13+8, 0, 2],
    [0, totalWidth, 0, 11],
    [0, totalWidth-1, 0, 11],
    [0, totalWidth*2, 0, 11],
    [0, totalWidth-19-12, 0, 11],
    [0, totalWidth-19-13, 0, 10],
    [0, totalWidth-19-13-1, 0, 10],
    [1, 1, 0, 1],
    [1, 17+13+6, 0, 1],
    [2, 17+13+6, 0, 2],
    [17+12, 1, 0, 1],
    [17+13, 1, 1, 1],
    [17+13, 7+13, 1, 1],
    [17+13, 7+13+7, 1, 1],
    [17+13, 7+13+8, 1, 2],
    [17+14, 7+13+7, 1, 2],
    [totalWidth-19-13-7, 1, 10, 1],
    [totalWidth-19-13-8, 1, 9, 1],
    [totalWidth-19-13-8, 8, 9, 1],
    [totalWidth-19-13-8, 9, 9, 2]
  ];

  for (var i = 0, len = tests.length; i < len; ++i) {
    var test = tests[i];
    var range = attrs.computeRange({left: test[0], width: test[1]}, 11);
    assert.equal(range.startIndex, test[2], test.toString());
    assert.equal(range.length, test[3], test.toString());
  }
}

function testComputeRegion() {
  var attrs = new BarStyleAttrs({
    leftMargin: 17,
    rightMargin: 19,
    barSpacing: 7,
    barWidth: 13
  });

  var totalWidth = 17 + 19 + 13*11 + 7*10;

  // These are arrays of the form [startIndex, length, left, width].
  var tests = [
    [0, 1, 0, 17+13+7],
    [0, 2, 0, 17+13*2+7*2],
    [1, 1, 17+13, 7*2+13],
    [1, 2, 17+13, 7*3+13*2],
    [10, 1, totalWidth-19-13-7, 7+13+19],
    [9, 1, totalWidth-19-13*2-7*2, 7*2+13],
    [9, 2, totalWidth-19-13*2-7*2, 7*2+13*2+19],
    [0, 100, 0, totalWidth],
    [0, 11, 0, totalWidth],
    [0, 10, 0, totalWidth-19-13]
  ];

  for (var i = 0, len = tests.length; i < len; ++i) {
    var test = tests[i];
    var region = attrs.computeRegion({startIndex: test[0], length: test[1]}, 11);
    assert.equal(region.left, test[2], test.toString());
    assert.equal(region.width, test[3], test.toString());
  }
}

function testRandomConversions() {
  for (var j = 0; j < 200; ++j) {
    var attrs = new BarStyleAttrs({
      leftMargin: 1 + Math.round(Math.random() * 10),
      rightMargin: 1 + Math.round(Math.random() * 10),
      barSpacing: 1 + Math.round(Math.random() * 10),
      barWidth: 1 + Math.round(Math.random() * 10)
    });

    var pointCount = Math.floor(Math.random() * 10);
    var totalWidth = 0;
    if (pointCount > 0) {
      totalWidth = attrs.getLeftMargin() + attrs.getRightMargin() +
        pointCount*attrs.getBarWidth() + (pointCount-1)*attrs.getBarSpacing();
    }

    for (var i = 0; i < 500; ++i) {
      var start = Math.floor(Math.random()*pointCount + 2);
      var length = Math.floor(Math.random()*pointCount + 2);
      var region = attrs.computeRegion({startIndex: start, length: length}, pointCount);
      var actualRange = attrs.computeRange(region, pointCount);

      start = Math.min(start, pointCount);
      length = Math.min(pointCount-start, length);
      if (length === 0) {
        assert.equal(actualRange.length, 0);
      } else {
        assert.equal(actualRange.startIndex, start);
        assert.equal(actualRange.length, length);
      }
    }

    for (var i = 0; i < 500; ++i) {
      var left = Math.floor(Math.random()*totalWidth + 10);
      var width = Math.floor(Math.random()*totalWidth + 10);
      var range = attrs.computeRange({left: left, width: width}, pointCount);
      var actualRegion = attrs.computeRegion(range, pointCount);

      left = Math.min(totalWidth, left);
      width = Math.min(totalWidth-left, width);

      assert(regionContains(actualRegion, {left: left, width: width}));
    }
  }
}

testComputeRange();
testComputeRegion();
testRandomConversions();
console.log('PASS');
