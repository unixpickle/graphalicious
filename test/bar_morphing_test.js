var SMALL_NUM = 0.001;

var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var fs = require('fs');

var BarStyleAttrs;
var MorphingBarLandscape;

(function() {
  var code0 = fs.readFileSync(__dirname + '/../src/styles/attrs.js');
  var code1 = fs.readFileSync(__dirname + '/../src/styles/bar_style.js');
  var code2 = fs.readFileSync(__dirname + '/../src/styles/bar_morphing.js');
  var code3 = fs.readFileSync(__dirname + '/../src/styles/utilities.js');
  code = '(function() {' + code0 + code1 + code2 + code3 +
    ';return [MorphingBarLandscape, BarStyleAttrs];})()';
  var res = eval(code);
  MorphingBarLandscape = res[0];
  BarStyleAttrs = res[1];
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
        ' but got ' + JSON.stringify(range) + ' for test ' + i + ' (' + test +
        ') and visibility=' + v/10;
      assert.equal(range.startIndex, test[2], msg);
      assert.equal(range.length, test[3], msg);
    }
  }
}

function testComputeRangeMorphingMiddle() {
  computeRangeTests(6, function(morphingValue) {
    var morphingSpace = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 6*13 + (5+0.5+0.5*morphingValue)*7;
    var spaceAfterMorphing = 19 + 4*13 + (3+0.5+0.5*morphingValue)*7;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
      // Make sure it behaves regularly before the morphing bar.
      [-10, 9, 0, 0],
      [-10, 11, 0, 1],
      [-10, 10+17+13+7+SMALL_NUM, 0, 2],
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
      [-10, 10+spaceBeforeMorphing-SMALL_NUM, 0, 6],
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
        spaceBeforeMorphing - morphingSpace + SMALL_NUM,
        morphingSpace*2 + morphingWidth - SMALL_NUM*2,
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
    var morphingSpace = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 9*13 + (8+0.5+0.5*morphingValue)*7;
    var spaceAfterMorphing = 19 + 13 + morphingSpace;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
      // Make sure it behaves regularly before the morphing bar.
      [-10, 9, 0, 0],
      [-10, 11, 0, 1],
      [-10, 10+17+13+7+SMALL_NUM, 0, 2],
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
      [totalWidth-19-13-morphingSpace-SMALL_NUM, totalWidth, 9, 2],
      // Surround the morphing bar.
      [spaceBeforeMorphing-SMALL_NUM, morphingWidth+SMALL_NUM*2, 9, 1],
      [
        spaceBeforeMorphing - morphingSpace + SMALL_NUM,
        morphingSpace*2 + morphingWidth - SMALL_NUM*2,
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
      [totalWidth-19-13-morphingSpace+SMALL_NUM, totalWidth, 10, 1],
      [totalWidth-19-13-2, 1, 10, 1]
    ];
  });
}

function testComputeRangeMorphingNearStart() {
  computeRangeTests(1, function(morphingValue) {
    var morphingSpace = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 13 + morphingSpace;
    var spaceAfterMorphing = 19 + 9*13 + (8+0.5+0.5*morphingValue)*7;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
      // Make sure it behaves regularly before the morphing bar.
      [-10, 9, 0, 0],
      [-10, 11, 0, 1],
      [0, 1, 0, 1],
      [1, 1, 0, 1],
      [0, 17+13, 0, 1],
      [0, 17+13+morphingSpace-SMALL_NUM, 0, 1],
      [1, 17+12+morphingSpace-SMALL_NUM, 0, 1],
      [17+13-SMALL_NUM, 1, 0, 1],
      // Barely touch the left of the morphing bar.
      [-10, 10+17+13+morphingSpace+SMALL_NUM, 0, 2],
      [17+13+SMALL_NUM, 1, 1, 1],
      [1, 17+13+morphingSpace, 0, 2],
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
        spaceBeforeMorphing - morphingSpace + SMALL_NUM,
        morphingSpace*2 + morphingWidth - SMALL_NUM*2,
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
      [-10, 9, 0, 0],
      // Regions in the whitespace before the morphing bar.
      [-10, 11, 0, 1],
      [0, 1, 0, 1],
      [0, 17-SMALL_NUM, 0, 1],
      [0, 16, 0, 1],
      [0, 1, 0, 1],
      [17-SMALL_NUM*2, SMALL_NUM, 0, 1],
      // Regions directly past the morphing bar.
      [17+morphingWidth+SMALL_NUM, SMALL_NUM, 1, 1],
      [17+morphingWidth+SMALL_NUM, morphingSpace+SMALL_NUM, 1, 1],
      [17+morphingWidth+SMALL_NUM, morphingSpace+13+7-SMALL_NUM*2, 1, 1],
      [17+morphingWidth+SMALL_NUM, morphingSpace+13+7, 1, 2],
      [17+morphingWidth+SMALL_NUM, morphingSpace+13+7+2*SMALL_NUM, 1, 2],
      [17+morphingWidth+SMALL_NUM, totalWidth, 1, 10]
    ];

    if (morphingValue > 0) {
      // Regions which only include the morphing bar.
      tests = tests.concat([
        [-10, 10+17+SMALL_NUM, 0, 1],
        [0, 17+SMALL_NUM, 0, 1],
        [0, 17+morphingWidth+morphingSpace-SMALL_NUM, 0, 1],
        [17-SMALL_NUM, morphingWidth+2*SMALL_NUM, 0, 1]
      ]);
      // Regions intersecting the morphing bar.
      if (morphingWidth > 0) {
        tests = tests.concat([
          [-10, 10+17+morphingWidth+morphingSpace+SMALL_NUM, 0, 2],
          [17+SMALL_NUM, SMALL_NUM, 0, 1],
          [17+morphingWidth-SMALL_NUM, morphingSpace, 0, 1]
        ]);
      }
    } else {
      // A fancy region past the morphing bar.
      tests.push([17+SMALL_NUM, SMALL_NUM, 1, 1]);
    }

    return tests;
  });
}

function testComputeRangeMorphingLast() {
  computeRangeTests(10, function(morphingValue) {
    var morphingSpace = 0;
    var morphingWidth = 0;
    if (morphingValue > 7/(13+7)) {
      morphingWidth = 13 * (morphingValue - 7/(13+7)) / (13/(13+7));
      morphingSpace = 7;
    } else {
      morphingSpace = morphingValue / (7/(13+7));
    }
    var spaceBeforeMorphing = 17 + 10*13 + 9*7 + morphingSpace;
    var totalWidth = 19 + morphingWidth + spaceBeforeMorphing;

    var tests = [
      // Ordinary regions near the beginning of the data.
      [-10, 9, 0, 0],
      [-10, 11, 0, 1],
      [-10, 10+17+13+7+SMALL_NUM, 0, 2],
      [0, 100, 0, 5],
      [51, 49, 2, 3],
      // Regions in the whitespace after the morphing bar.
      [totalWidth-1, 1, 10, 1],
      [totalWidth-19+SMALL_NUM, 19-SMALL_NUM, 10, 1],
      [totalWidth-16, 100, 10, 1],
      [totalWidth-19+SMALL_NUM, SMALL_NUM, 10, 1],
      // Regions directly before the morphing bar.
      [totalWidth-19-morphingWidth-morphingSpace-13-7+SMALL_NUM, 13+7-2*SMALL_NUM, 9, 1],
      [totalWidth-19-morphingWidth-morphingSpace-2*SMALL_NUM, morphingSpace+SMALL_NUM, 9, 1],
      [
        totalWidth - 19 - morphingWidth - morphingSpace - 13 - 7 - SMALL_NUM,
        13 + 7 + morphingSpace,
        8,
        2
      ],
      // Regions which include the morphing bar.
      [
        totalWidth - 19 - morphingWidth - morphingSpace - 13 - 7 + SMALL_NUM,
        13 + 7 + morphingSpace,
        9,
        2
      ],
      [
        totalWidth - 19 - morphingWidth - morphingSpace - 13 - 7 - SMALL_NUM,
        13 + 7 + morphingSpace + 2*SMALL_NUM,
        8,
        3
      ],
      [-10, 10+totalWidth-19-morphingWidth+SMALL_NUM, 0, 11],
    ];

    if (morphingValue > 0) {
      tests = tests.concat([
        // Regions which only include the morphing bar.
        [totalWidth-19-morphingWidth-SMALL_NUM*2, SMALL_NUM, 10, 1],
        [totalWidth-19-morphingWidth, 1, 10, 1],
        [totalWidth-19-morphingWidth-morphingSpace+SMALL_NUM, 1000, 10, 1],
        [totalWidth-19-morphingWidth-morphingSpace+SMALL_NUM, 1, 10, 1],
        [totalWidth-19-morphingWidth-SMALL_NUM, 1, 10, 1],
        // Regions directly before the morphing bar.
        [
          totalWidth - 19 - morphingWidth - morphingSpace - 13 - 7 + SMALL_NUM,
          13 + 7 + morphingSpace - 2*SMALL_NUM,
          9,
          1
        ],
        [totalWidth-19-morphingWidth-morphingSpace-SMALL_NUM, morphingSpace, 9, 1],
      ]);
      // Regions intersecting the morphing bar.
      if (morphingWidth > 0) {
        tests = tests.concat([
          [totalWidth-19-2*SMALL_NUM, SMALL_NUM, 10, 1],
          [totalWidth-19-morphingWidth+SMALL_NUM, SMALL_NUM, 10, 1],
        ]);
      }
    } else {
      // A fancy bar right before the morphing bar.
      tests.push([totalWidth-19-2*SMALL_NUM, SMALL_NUM, 9, 1]);
    }

    return tests;
  });
}

function computeRegionTests(morphingIndex, generator) {
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
      var region = landscape.computeRegion({startIndex: test[0], length: test[1]});
      var msg = 'Expected ' + JSON.stringify({left: test[2], width: test[3]}) +
        ' but got ' + JSON.stringify(region) + ' for test ' + i + ' and visibility=' + v/10;
      assert(Math.abs(region.left - test[2]) < SMALL_NUM, msg);
      assert(Math.abs(region.width - test[3]) < SMALL_NUM, msg);
    }
  }
}

function testComputeRegionMorphingMiddle() {
  computeRegionTests(6, function(morphingValue) {
    var morphingSpace = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 6*13 + (5+0.5+0.5*morphingValue)*7;
    var spaceAfterMorphing = 19 + 4*13 + (3+0.5+0.5*morphingValue)*7;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
      // Ranges before the morphing bar.
      [-1, 1, 0, 0],
      [-2, 1, 0, 0],
      [-10, 5, 0, 0],
      [-10, 11, 0, 17+13+7],
      [-10, 12, 0, 17+13*2+7*2],
      [0, 1, 0, 17+13+7],
      [0, 2, 0, 17+13*2+7*2],
      [1, 1, 17+13, 7*2+13],
      [1, 2, 17+13, 7*3+13*2],
      // Ranges which extend past the morphing bar.
      [0, 11, 0, totalWidth],
      [0, 10, 0, totalWidth-19-13],
      [1, 10, 17+13, totalWidth-17-13],
      [1, 9, 17+13, totalWidth-17-13*2-19],
      // Ranges which are left-adjacent to the morphing bar.
      [0, 6, 0, 17+13*6+7*5+morphingSpace],
      [5, 1, 17+13*5+7*4, 13+7+morphingSpace],
      // Ranges which are right-adjacent to the morphing bar.
      [7, 4, totalWidth-morphingSpace-13*4-7*3-19, morphingSpace+13*4+7*3+19],
      [7, 3, totalWidth-morphingSpace-13*4-7*3-19, morphingSpace+13*3+7*3],
      // Ranges which contain the morphing bar.
      [6, 1, spaceBeforeMorphing-morphingSpace, morphingSpace*2+morphingWidth],
      [5, 2, spaceBeforeMorphing-morphingSpace-13-7, 13+7+morphingSpace*2+morphingWidth],
      [6, 2, spaceBeforeMorphing-morphingSpace, morphingSpace*2+morphingWidth+13+7],
      [5, 3, spaceBeforeMorphing-morphingSpace-13-7, 13*2+7*2+morphingSpace*2+morphingWidth],
      // Ranges after the morphing bar.
      [10, 1, totalWidth-19-13-7, 7+13+19],
      [9, 2, totalWidth-19-13*2-7*2, 19+13*2+7*2],
      [11, 1, 0, 0],
      [12, 1, 0, 0]
    ];
  });
}

function testComputeRegionMorphingNearEnd() {
  computeRegionTests(9, function(morphingValue) {
    var morphingSpace = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 9*13 + (8+0.5+0.5*morphingValue)*7;
    var spaceAfterMorphing = 19 + 13 + morphingSpace;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
      // Ranges before the morphing bar.
      [-1, 1, 0, 0],
      [-2, 1, 0, 0],
      [-10, 5, 0, 0],
      [-10, 11, 0, 17+13+7],
      [-10, 12, 0, 17+13*2+7*2],
      [-10, 19, 0, spaceBeforeMorphing],
      [0, 9, 0, spaceBeforeMorphing],
      [1, 8, 17+13, spaceBeforeMorphing-13-17],
      [2, 1, 17+7+13*2, 13+7*2],
      // Ranges which extend past the morphing bar.
      [0, 11, 0, totalWidth],
      [1, 11, 17+13, totalWidth-17-13],
      // Ranges which include the morphing bar.
      [0, 10, 0, totalWidth-spaceAfterMorphing+morphingSpace],
      [1, 9, 17+13, totalWidth-spaceAfterMorphing+morphingSpace-17-13],
      [1, 10, 17+13, totalWidth-17-13],
      [9, 1, spaceBeforeMorphing-morphingSpace, morphingWidth+morphingSpace*2],
      [9, 2, spaceBeforeMorphing-morphingSpace, morphingWidth+morphingSpace*2+13+19],
      [9, 100, spaceBeforeMorphing-morphingSpace, morphingWidth+morphingSpace*2+13+19],
      // Ranges after the morphing bar.
      [10, 1, totalWidth-19-13-morphingSpace, morphingSpace+13+19],
      [10, 100, totalWidth-19-13-morphingSpace, morphingSpace+13+19],
      [11, 1, 0, 0],
      [12, 1, 0, 0]
    ];
  });
}

function testComputeRegionMorphingNearStart() {
  computeRegionTests(1, function(morphingValue) {
    var morphingSpace = (0.5 + 0.5*morphingValue) * 7;
    var spaceBeforeMorphing = 17 + 13 + morphingSpace;
    var spaceAfterMorphing = 19 + 9*13 + (8+0.5+0.5*morphingValue)*7;
    var morphingWidth = 13 * morphingValue;
    var totalWidth = spaceBeforeMorphing + morphingWidth + spaceAfterMorphing;

    return [
      // Ranges before the morphing bar.
      [-1, 1, 0, 0],
      [-2, 1, 0, 0],
      [-10, 5, 0, 0],
      [-10, 11, 0, 17+13+morphingSpace],
      [0, 1, 0, 17+13+morphingSpace],
      [0, 0, 0, 0],
      // Ranges which extend past the morphing bar.
      [-10, 13, 0, 17+13*2+7+morphingSpace*2+morphingWidth],
      [-10, 21, 0, totalWidth],
      [-10, 20, 0, totalWidth-19-13],
      [0, 3, 0, 17+13*2+7+morphingSpace*2+morphingWidth],
      [0, 11, 0, totalWidth],
      // Ranges which include the morphing bar.
      [1, 1, 17+13, morphingSpace*2+morphingWidth],
      [0, 2, 0, 17+13+morphingSpace*2+morphingWidth],
      [1, 2, 17+13, morphingSpace*2+morphingWidth+13+7],
      [1, 10, 17+13, totalWidth-17-13],
      // Ranges after the morphing bar.
      [2, 9, totalWidth-spaceAfterMorphing, spaceAfterMorphing],
      [3, 8, totalWidth-spaceAfterMorphing+morphingSpace+13, spaceAfterMorphing-13-morphingSpace]
    ]
  });
}

function testComputeRegionMorphingFirst() {
  computeRegionTests(0, function(morphingValue) {
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

    return [
      // Null regions.
      [-1, 1, 0, 0],
      [-2, 1, 0, 0],
      [-10, 5, 0, 0],
      [3, 0, 0, 0],
      // Regions which include the morphing bar.
      [0, 1, 0, 17+morphingWidth+morphingSpace],
      [0, 2, 0, 17+morphingWidth+morphingSpace+13+7],
      [0, 11, 0, totalWidth],
      [-10, 25, 0, totalWidth],
      [-10, 21, 0, totalWidth],
      [-10, 20, 0, totalWidth-19-13],
      // Region past the morphing bar.
      [1, 1, totalWidth-spaceAfterMorphing, morphingSpace+7+13],
      [1, 2, totalWidth-spaceAfterMorphing, morphingSpace+7*2+13*2],
      [1, 10, totalWidth-spaceAfterMorphing, spaceAfterMorphing],
      [2, 9, totalWidth-spaceAfterMorphing+morphingSpace+13, spaceAfterMorphing-morphingSpace-13],
      [2, 1, totalWidth-spaceAfterMorphing+morphingSpace+13, 7*2+13]
    ];
  });
}

function testComputeRegionMorphingLast() {
  computeRegionTests(10, function(morphingValue) {
    var morphingSpace = 0;
    var morphingWidth = 0;
    if (morphingValue > 7/(13+7)) {
      morphingWidth = 13 * (morphingValue - 7/(13+7)) / (13/(13+7));
      morphingSpace = 7;
    } else {
      morphingSpace = morphingValue / (7/(13+7));
    }
    var spaceBeforeMorphing = 17 + 10*13 + 9*7 + morphingSpace;
    var totalWidth = 19 + morphingWidth + spaceBeforeMorphing;

    return [
      // Regions before the morphing bar.
      [-1, 1, 0, 0],
      [-2, 1, 0, 0],
      [-10, 5, 0, 0],
      [0, 1, 0, 17+13+7],
      [0, 5, 0, 13*5+7*5+17],
      [1, 5, 17+13, 13*5+7*6],
      [0, 10, 0, totalWidth-19-morphingWidth],
      // Regions including the morphing bar.
      [0, 11, 0, totalWidth],
      [10, 1, spaceBeforeMorphing-morphingSpace, totalWidth-spaceBeforeMorphing+morphingSpace],
      [10, 2, spaceBeforeMorphing-morphingSpace, totalWidth-spaceBeforeMorphing+morphingSpace],
      [1, 10, 17+13, totalWidth-17-13]
    ];
  });
}

function testComputeBarRegion() {
  var attrs = new BarStyleAttrs({
    leftMargin: 17,
    rightMargin: 19,
    barSpacing: 7,
    barWidth: 13
  });
  var landscape = new MorphingBarLandscape({
    attrs: attrs,
    pointCount: 11,
    morphingIndex: 0,
    morphingVisibility: 1
  });

  var totalWidth = 19 + 17 + 13*11 + 7*10;

  // These are pairs of the form (index, left coordinate)
  var tests = [
    [0, 17],
    [10, totalWidth-19-13],
    [1, 17+13+7],
    [5, 17+5*7+5*13]
  ];
  for (var i = 0, len = tests.length; i < len; ++i) {
    var test = tests[i];
    var result = landscape.computeBarRegion(test[0]);
    assert(Math.abs(result.left - test[1]) < SMALL_NUM, 'Test ' + i + ' failed.');
    assert(Math.abs(result.width - 13) < SMALL_NUM, 'Test ' + i + ' failed.');
  }
}

testComputeRangeMorphingMiddle();
testComputeRangeMorphingNearEnd();
testComputeRangeMorphingNearStart();
testComputeRangeMorphingFirst();
testComputeRangeMorphingLast();

testComputeRegionMorphingMiddle();
testComputeRegionMorphingNearEnd();
testComputeRegionMorphingNearStart();
testComputeRegionMorphingFirst();
testComputeRegionMorphingLast();

testComputeBarRegion();

console.log('PASS');
