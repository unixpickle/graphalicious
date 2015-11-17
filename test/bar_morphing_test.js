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

function computeRangeTests(morphingIndex, generator) {
  for (var v = 0; v <= 10; v += 10) {
    var attrs = new BarStyleAttrs({
      leftMargin: 17,
      rightMargin: 19,
      barSpacing: 7,
      barWidth: 13
    });
    var landscape = new MorphingBarLandscape({
      attrs: attrs,
      pointCount: 11,
      morphingIndex: morphingIndex,
      morphingVisibility: v / 10
    });

    var tests = generator(v / 10);
    for (var i = 0, len = tests.length; i < len; ++i) {
      var test = tests[i];
      var range = landscape.computeRange({left: test[0], width: test[1]});
      var msg = 'Expected ' + JSON.stringify({startIndex: test[2], length: test[3]}) +
        ' but got ' + JSON.stringify(range) + ' for test ' + i + ' and visibility=' + v/10;
      assert.equal(range.startIndex, test[2], msg);
      assert.equal(range.length, test[3], msg);
    }
  }
}

function testComputeRangeMorphingMiddle() {
  computeRangeTests(6, function(morphingValue) {
    var morphingPadding = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 6*13 + (5+0.5+0.5*morphingValue)*7;
    var spaceAfterMorphing = 19 + 4*13 + (3+0.5+0.5*morphingValue)*7;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
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
      [spaceBeforeMorphing-SMALL_NUM*2, SMALL_NUM, 6, 1],
      // Barely touch the right of the morphing bar.
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, 1, 7, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, SMALL_NUM, 7, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, totalWidth, 7, 4],
      [spaceBeforeMorphing+morphingWidth-SMALL_NUM, 1, 6, 1],
      // Surround the morphing bar.
      [spaceBeforeMorphing-SMALL_NUM, morphingWidth+SMALL_NUM*2, 6, 1],
      [
        spaceBeforeMorphing - morphingPadding + SMALL_NUM,
        morphingPadding*2 + morphingWidth - SMALL_NUM*2,
        6,
        1
      ],
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
  });
}

function testComputeRangeMorphingNearEnd() {
  computeRangeTests(9, function(morphingValue) {
    var morphingPadding = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 9*13 + (8+0.5+0.5*morphingValue)*7;
    var spaceAfterMorphing = 19 + 13 + morphingPadding;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
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
      [0, spaceBeforeMorphing-SMALL_NUM, 0, 9],
      [0, spaceBeforeMorphing+SMALL_NUM, 0, 10],
      [19+13, spaceBeforeMorphing-13-19-SMALL_NUM, 1, 8],
      [19+13, spaceBeforeMorphing-13-19+SMALL_NUM, 1, 9],
      [spaceBeforeMorphing-8, 8-SMALL_NUM, 8, 1],
      [spaceBeforeMorphing-8, 8+SMALL_NUM, 8, 2],
      [spaceBeforeMorphing-SMALL_NUM*2, SMALL_NUM, 9, 1],
      // Barely touch the right of the morphing bar.
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, 1, 10, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, SMALL_NUM, 10, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, totalWidth, 10, 1],
      [spaceBeforeMorphing+morphingWidth-SMALL_NUM, 1, 9, 1],
      [totalWidth-19-13-morphingPadding-SMALL_NUM, totalWidth, 9, 2],
      // Surround the morphing bar.
      [spaceBeforeMorphing-SMALL_NUM, morphingWidth+SMALL_NUM*2, 9, 1],
      [
        spaceBeforeMorphing - morphingPadding + SMALL_NUM,
        morphingPadding*2 + morphingWidth - SMALL_NUM*2,
        9,
        1
      ],
      // Make sure it behaves regularly after the morphing bar.
      [0, totalWidth, 0, 11],
      [0, totalWidth-1, 0, 11],
      [0, totalWidth*2, 0, 11],
      [0, totalWidth-19-13+SMALL_NUM, 0, 11],
      [0, totalWidth-19-13-SMALL_NUM, 0, 10],
      [0, totalWidth-19-14, 0, 10],
      [totalWidth-19-13-morphingPadding+SMALL_NUM, totalWidth, 10, 1],
      [totalWidth-19-13-2, 1, 10, 1]
    ];
  });
}

function testComputeRangeMorphingNearStart() {
  computeRangeTests(1, function(morphingValue) {
    var morphingPadding = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 13 + morphingPadding;
    var spaceAfterMorphing = 19 + 9*13 + (8+0.5+0.5*morphingValue)*7;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
      // Make sure it behaves regularly before the morphing bar.
      [0, 1, 0, 1],
      [1, 1, 0, 1],
      [0, 17+13, 0, 1],
      [0, 17+13+morphingPadding-SMALL_NUM, 0, 1],
      [1, 17+12+morphingPadding-SMALL_NUM, 0, 1],
      [17+13-SMALL_NUM, 1, 0, 1],
      // Barely touch the left of the morphing bar.
      [17+13+SMALL_NUM, 1, 1, 1],
      [1, 17+13+morphingPadding, 0, 2],
      [0, spaceBeforeMorphing-SMALL_NUM, 0, 1],
      [0, spaceBeforeMorphing+SMALL_NUM, 0, 2],
      [spaceBeforeMorphing-8, 8-SMALL_NUM, 0, 1],
      [spaceBeforeMorphing-8, 8+SMALL_NUM, 0, 2],
      [spaceBeforeMorphing-SMALL_NUM*2, SMALL_NUM, 1, 1],
      // Barely touch the right of the morphing bar.
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, 1, 2, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, SMALL_NUM, 2, 1],
      [spaceBeforeMorphing+morphingWidth+SMALL_NUM, totalWidth, 2, 9],
      [spaceBeforeMorphing+morphingWidth-SMALL_NUM, 1, 1, 1],
      // Surround the morphing bar.
      [spaceBeforeMorphing-SMALL_NUM, morphingWidth+SMALL_NUM*2, 1, 1],
      [
        spaceBeforeMorphing - morphingPadding + SMALL_NUM,
        morphingPadding*2 + morphingWidth - SMALL_NUM*2,
        1,
        1
      ],
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
  });
}

function testComputeRangeMorphingFirst() {
  computeRangeTests(0, function(morphingValue) {
    var morphingSpace = 0;
    var morphingWidth = 0;
    if (morphingValue > 7/(13+7)) {
      morphingWidth = 13 * (morphingValue - 7/(13+7)) / (13/(13+7));
      morphingSpace = 7;
    } else {
      morphingSpace = morphingValue / (7/(13+7));
    }
    var spaceAfterMorphing = 19 + 10*13 + 9*7 + morphingSpace;
    var totalWidth = 17 + morphingWidth + spaceAfterMorphing;

    var tests = [
      // Regions in the whitespace before the morphing bar.
      [0, 1, 0, 1],
      [0, 17-SMALL_NUM, 0, 1],
      [0, 16, 0, 1],
      [0, 1, 0, 1],
      [17-SMALL_NUM*2, 17-SMALL_NUM, 0, 1],
      // Regions directly past the morphing bar.
      [17+morphingWidth+SMALL_NUM, SMALL_NUM, 1, 1],
      [17+morphingWidth+SMALL_NUM, morphingSpace, 1, 1],
      [17+morphingWidth+SMALL_NUM, morphingSpace+13+7, 1, 1],
      [17+morphingWidth+SMALL_NUM, morphingSpace+13+7+2*SMALL_NUM, 1, 2],
      [17+morphingWidth+SMALL_NUM, totalWidth, 1, 10],
    ];

    if (morphingValue > 0) {
      // Regions which only include the morphing bar.
      tests = tests.concat([
        [0, 17+SMALL_NUM, 0, 1],
        [0, 17+morphingWidth+morphingPadding-SMALL_NUM, 0, 1],
        [17-SMALL_NUM, 17+morphingWidth+SMALL_NUM, 0, 1]
      ]);
      // Regions intersecting the morphing bar.
      if (morphingWidth > 0) {
        tests = tests.concat([
          [17+SMALL_NUM, SMALL_NUM, 0, 1],
          [17+morphingWidth-SMALL_NUM, morphingPadding, 0, 1]
        ]);
      }
    } else {
      // A fancy region past the morphing bar.
      tests.push([17+SMALL_NUM, SMALL_NUM, 1, 1]);
    }

    return tests;
  });
}

// TODO: in the test for computeRegion, try giving it a completely hidden morphing bar and see what
// happens.

testComputeRangeMorphingMiddle();
testComputeRangeMorphingNearEnd();
testComputeRangeMorphingNearStart();
testComputeRangeMorphingFirst();
console.log('PASS');
