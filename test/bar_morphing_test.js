var SMALL_NUM = 0.001;

var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var fs = require('fs');

var BarStyleAttrs = (function() {
  var code = fs.readFileSync(__dirname + '/../src/styles/bar_style.js');
  code = '(function() {' + code + ';return BarStyleAttrs})()';
  return eval(code);
})();

var MorphingBarLandscape = (function() {
  var code = fs.readFileSync(__dirname + '/../src/styles/bar_morphing.js');
  code = '(function() {' + code + ';return MorphingBarLandscape})()';
  return eval(code);
})();

function testComputeRangeMorphingMiddle() {
  for (var morphingValue = 0; morphingValue <= 1; morphingValue += 0.1) {
    var attrs = new BarStyleAttrs({
      leftMargin: 17,
      rightMargin: 19,
      barSpacing: 7,
      barWidth: 13
    });

    var landscape = new MorphingBarLandscape({
      attrs: attrs,
      pointCount: 11,
      morphingIndex: 6,
      morphingVisibility: morphingValue
    });

    var spaceBeforeMorphing = 17 + 6*13 + (5+0.5+0.5*morphingValue)*7;
    var spaceAfterMorphing = 19 + 4*13 + (3+0.5+0.5*morphingValue)*7;
    var morphingWidth = 13*morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    // These are of the form [left, width, startIndex, length].
    var tests = [
      // Make sure it behaves regularly before the morphing bar.
      [0, 1, 0, 1],
      [1, 1, 0, 1],
      [0, 17+13, 0, 1],
      [0, 17+13+7-SMALL_NUM, 0, 1],
      [0, 17+13+7+SMALL_NUM, 0, 2],
      [1, 17+13+6-SMALL_NUM, 0, 1],
      [1, 17+13+6+SMALL_NUM, 0, 2],
      [17+13-SMALL_NUM, 1, 0, 1],
      [17+13+SMALL_NUM, 1, 1, 1],
      [17+13+SMALL_NUM, 1, 1, 1],
      [17+13+SMALL_NUM, 7+13, 1, 1],
      [17+13+SMALL_NUM, 7+13+7-SMALL_NUM*2, 1, 1],
      [17+13+SMALL_NUM, 7+13+7+SMALL_NUM*2, 1, 2],
      // Barely touch the left of the morphing bar.
      [0, spaceBeforeMorphing-SMALL_NUM, 0, 6],
      [0, spaceBeforeMorphing+SMALL_NUM, 0, 7],
      [19+13, spaceBeforeMorphing-13-19-SMALL_NUM, 1, 5],
      [19+13, spaceBeforeMorphing-13-19+SMALL_NUM, 1, 6],
      [spaceBeforeMorphing-8, 8-SMALL_NUM, 5, 1],
      [spaceBeforeMorphing-8, 8+SMALL_NUM, 5, 2],
      // Barely touch the right of the morphing bar.
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, 1, 7, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, SMALL_NUM, 7, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, totalWidth, 7, 4],
      [spaceBeforeMorphing+morphingWidth-SMALL_NUM, 1, 6, 1],
      [spaceBeforeMorphing-SMALL_NUM*2, SMALL_NUM, 6, 1],
      [spaceBeforeMorphing-SMALL_NUM, morphingWidth+SMALL_NUM*2, 6, 1],
      // Make sure it behaves regularly after the morphing bar.
      [0, totalWidth, 0, 11],
      [0, totalWidth-1, 0, 11],
      [0, totalWidth*2, 0, 11],
      [0, totalWidth-19-13+SMALL_NUM, 0, 11],
      [0, totalWidth-19-13-SMALL_NUM, 0, 10],
      [0, totalWidth-19-14, 0, 10],
      [totalWidth-19-13-7+SMALL_NUM, 1, 10, 1],
      [totalWidth-19-13-8, 2, 9, 1],
      [totalWidth-19-13-8, 1-SMALL_NUM, 9, 1],
      [totalWidth-19-13-8, 8-SMALL_NUM, 9, 1],
      [totalWidth-19-13-8, 8+SMALL_NUM, 9, 2],
      [totalWidth-19-13-8, 9, 9, 2]
    ];

    for (var i = 0, len = tests.length; i < len; ++i) {
      var test = tests[i];
      var range = landscape.computeRange({left: test[0], width: test[1]});
      assert.equal(range.startIndex, test[2], test);
      assert.equal(range.length, test[3], test);
    }
  }
}

// TODO: in the test for computeRegion, try giving it a completely hidden morphing bar and see what
// happens.

testComputeRangeMorphingMiddle();
console.log('PASS');
