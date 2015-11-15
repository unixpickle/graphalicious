var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var fs = require('fs');
var BarStyleAttrs = (function() {
  var code = fs.readFileSync(__dirname + '/../src/styles/bar_style.js');
  code = '(function() {' + code + ';return BarStyleAttrs})()';
  return eval(code);
})();

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
  // TODO: test this
  assert(false, 'NYI');
}

testComputeRange();
testComputeRegion();
