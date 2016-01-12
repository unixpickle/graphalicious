var SMALL_NUM = 0.001;

var assert = require('assert');

var DataSource = require(__dirname + '/data_source.js');
var Canvas = require(__dirname + '/dummy_canvas.js');

var currentAnimationFrameCb;

function callAnimationFrameCb(arg) {
  var cb = currentAnimationFrameCb;
  currentAnimationFrameCb = null;
  cb(arg);
}

var importRes = require('./importer')([
  'base/color_scheme.js', 'base/attrs.js', 'styles/bar_style.js',
  'styles/bar_xmarkers.js', 'styles/bar_draw_params.js', 'styles/bar_morphing.js',
  'styles/bar_chunk_view.js', 'styles/utilities.js', 'styles/blurb.js',
  'styles/blurb_manager.js'
], ['BarStyle', 'ColorScheme', 'BarChunkView'], {
  window: {
    requestAnimationFrame: function(f) {
      currentAnimationFrameCb = f;
      return 0;
    },
    cancelAnimationFrame: function() {
      currentAnimationFrameCb = null;
    },
    crystal: {
      getRatio: function() {
        return 1;
      }
    },
    EventEmitter: require('events').EventEmitter
  },
  document: {
    createElement: function(name) {
      assert.equal(name, 'canvas');
      return new Canvas();
    }
  },
  EventEmitter: require('events').EventEmitter
});

var BarStyle = importRes.BarStyle;
var ColorScheme = importRes.ColorScheme;
var BarChunkView = importRes.BarChunkView;

function testWidth() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40
  });

  var dataSource = DataSource.random(1000, 10, true);
  dataSource.insert(3, {primary: 5, secondary: -1});
  var chunk = dataSource.fetchChunkSync(0, 0, 100);
  var chunkView = style.createChunkView(chunk, dataSource);

  assert(chunkView.getWidth() === 10+40*100+5*100);
}

function testDrawBestCase() {
  var xLabelOffsets = [
    {alignment: BarStyle.X_LABELS_LEFT, x0: 5, x1: 52.5, rangeLen: 7},
    {alignment: BarStyle.X_LABELS_CENTER, x0: 30, x1: 75, rangeLen: 7},
    {alignment: BarStyle.X_LABELS_RIGHT, x0: 52.5, x1: 97.5, rangeLen: 6},
  ];

  for (var j = 0; j < 3; ++j) {
    var xInfo = xLabelOffsets[j];

    var style = new BarStyle({
      colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
      leftMargin: 10,
      rightMargin: 10,
      barSpacing: 5,
      barWidth: 40,
      xLabelAlignment: xInfo.alignment
    });

    var dataSource = DataSource.random(1000, 10, true);
    dataSource.insert(3, {primary: 5, secondary: -1});
    var chunk = dataSource.fetchChunkSync(0, 0, 100);

    var chunkView = style.createChunkView(chunk, dataSource);
    var context = new Canvas().getContext('2d');

    var viewport = {context: context, x: 10, y: 5, width: 313, height: 100};
    var report = chunkView.draw(viewport, 0, 20);
    assert(Math.abs(report.width - 313) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

    assert(report.xMarkers.getLength() === dataSource.getLength());
    var visibleMarkers = report.xMarkers.computeRange({left: 0, width: 323});
    assert(visibleMarkers.startIndex === 0);
    assert(visibleMarkers.length === xInfo.rangeLen);
    for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      assert(marker.index === i);
      assert(marker.oldIndex === i);
      assert(marker.oldDataPoint === null);
      assert(marker.animationProgress === -1);
    }

    var firstXValue = xInfo.x0 + viewport.x;
    assert(Math.abs(report.xMarkers.getXMarker(0).x-firstXValue) < SMALL_NUM,
      'invalid x for first x marker');

    for (var i = 1, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      var xValue = viewport.x + xInfo.x1 + (i-1)*45;
      if (i === len-1 && xInfo.alignment === BarStyle.X_LABELS_RIGHT) {
        xValue += 2.5;
      }
      assert(Math.abs(marker.x - xValue) < SMALL_NUM, 'invalid x for x marker ' + i);
    }
  }
}

function testDrawBasicScrolling() {
  var xLabelOffsets = [
    {alignment: BarStyle.X_LABELS_LEFT, x0: 5, x1: 52.5, rangeLen0: 7, rangeLen1: 7,
      rangeStart1: 1},
    {alignment: BarStyle.X_LABELS_CENTER, x0: 30, x1: 75, rangeLen0: 7, rangeLen1: 7,
      rangeStart1: 1},
    {alignment: BarStyle.X_LABELS_RIGHT, x0: 52.5, x1: 97.5, rangeLen0: 6, rangeLen1: 7,
      rangeStart1: 0},
  ];

  for (var j = 0; j < 3; ++j) {
    var xInfo = xLabelOffsets[j];

    var style = new BarStyle({
      colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
      leftMargin: 10,
      rightMargin: 10,
      barSpacing: 5,
      barWidth: 40,
      xLabelAlignment: xInfo.alignment
    });

    var dataSource = DataSource.random(1000, 10, true);
    dataSource.insert(3, {primary: 5, secondary: -1});
    var chunk = dataSource.fetchChunkSync(0, 0, 100);

    var chunkView = style.createChunkView(chunk, dataSource);
    var context = new Canvas().getContext('2d');

    var viewport = {context: context, x: 10, y: 5, width: 313, height: 100};

    var report = chunkView.draw(viewport, 3, 20);
    assert(Math.abs(report.width - 313) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

    assert(report.xMarkers.getLength() === dataSource.getLength());
    var visibleMarkers = report.xMarkers.computeRange({left: 10, width: 313});
    assert(visibleMarkers.startIndex === 0);
    assert(visibleMarkers.length === xInfo.rangeLen0);
    for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      assert(marker.index === i);
      assert(marker.oldIndex === i);
      assert(marker.oldDataPoint === null);
      assert(marker.animationProgress === -1);
    }

    var firstXValue = xInfo.x0 + viewport.x - 3;
    assert(Math.abs(report.xMarkers.getXMarker(0).x - firstXValue) < SMALL_NUM,
      'invalid x for first x marker');

    for (var i = 1, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      var xValue = viewport.x + xInfo.x1 + (i-1)*45 - 3;
      if (i === len-1 && xInfo.alignment === BarStyle.X_LABELS_RIGHT) {
        xValue += 2.5;
      }
      assert(Math.abs(marker.x - xValue) < SMALL_NUM, 'invalid x for x marker ' + i);
    }

    var report = chunkView.draw(viewport, 51, 20);
    assert(Math.abs(report.width - 313) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

    assert(report.xMarkers.getLength() === dataSource.getLength());
    var visibleMarkers = report.xMarkers.computeRange({left: 10, width: 313});
    assert(visibleMarkers.startIndex === xInfo.rangeStart1);
    assert(visibleMarkers.length === xInfo.rangeLen1);
    for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      assert(marker.index === i);
      assert(marker.oldIndex === i);
      assert(marker.oldDataPoint === null);
      assert(marker.animationProgress === -1);
    }

    firstXValue = xInfo.x0 + viewport.x - 51;
    assert(Math.abs(report.xMarkers.getXMarker(0).x - firstXValue) < SMALL_NUM,
      'invalid x for first x marker');

    for (var i = 1, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      var xValue = viewport.x + xInfo.x1 + (i-1)*45 - 51;
      if (i === len-1 && xInfo.alignment === BarStyle.X_LABELS_RIGHT) {
        xValue += 2.5;
      }
      assert(Math.abs(marker.x - xValue) < SMALL_NUM, 'invalid x for x marker ' + i);
    }
  }
}

function testDrawEdgeCases() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT
  });

  var dataSource = DataSource.random(1000, 10, true);
  dataSource.insert(7, {primary: 5, secondary: -1});
  var chunk = dataSource.fetchChunkSync(0, 5, 10);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {context: context, x: 10, y: 5, width: 313, height: 100};

  // Draw the content so it cannot fill the left part of the viewport.

  var report = chunkView.draw(viewport, 10, 20);
  assert(Math.abs(report.width - (313 - (40*5+5*4))) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - (10 + 40*5 + 5*4)) < SMALL_NUM, 'invalid left offset');

  assert(report.xMarkers.getLength() === dataSource.getLength());
  var visibleMarkers = report.xMarkers.computeRange({left: 10 + 40*5 + 5*4, width: 83});
  assert(visibleMarkers.startIndex === 5);
  assert(visibleMarkers.length === 2);
  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var marker = report.xMarkers.getXMarker(i);
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.oldDataPoint === null);
    assert(marker.animationProgress === -1);
  }

  assert(Math.abs(report.xMarkers.getXMarker(5).x - (10+40*5+5*4+2.5)) < SMALL_NUM);
  assert(Math.abs(report.xMarkers.getXMarker(6).x - (10+40*6+5*5+2.5)) < SMALL_NUM);

  // Draw the content so it barely fills the entire viewport.

  report = chunkView.draw(viewport, 10+40*5+5*4+1, 20);
  assert(Math.abs(report.width - 313) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

  assert(report.xMarkers.getLength() === dataSource.getLength());
  var visibleMarkers = report.xMarkers.computeRange({left: 10, width: 313});
  assert(visibleMarkers.startIndex === 5);
  assert(visibleMarkers.length === 7);
  var startMarkerX = 10 + 2.5 - 1;
  for (var i = 5, len = report.xMarkers.getLength(); i < len; ++i) {
    var marker = report.xMarkers.getXMarker(i);
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.oldDataPoint === null);
    assert(marker.animationProgress === -1);
    assert(Math.abs(marker.x - startMarkerX - (i-5)*45) < SMALL_NUM);
  }

  // Draw the content so it does not fill the right part of the viewport.

  report = chunkView.draw(viewport, (15*40+5*15+10) - 111, 20);
  assert(Math.abs(report.width - 111) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

  assert(report.xMarkers.getLength() === dataSource.getLength());
  var visibleMarkers = report.xMarkers.computeRange({left: 10, width: 313});
  assert(visibleMarkers.startIndex === 13);
  assert(visibleMarkers.length === 7);
  startMarkerX = -16.5;
  for (var i = 12, len = report.xMarkers.getLength(); i < len; ++i) {
    var marker = report.xMarkers.getXMarker(i);
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.oldDataPoint === null);
    assert(marker.animationProgress === -1);
    assert(Math.abs(marker.x - startMarkerX - (i-12)*45) < SMALL_NUM);
  }

  // Draw the content so that it only fills the middle of the viewport.

  viewport.width = 10 + 20*40 + 20*5;
  report = chunkView.draw(viewport, 0, 20);

  assert(Math.abs(report.width - (11*5 + 10*40)) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - (10*2 + 40*5 + 5*4)) < SMALL_NUM, 'invalid left offset');

  assert(report.xMarkers.getLength() === dataSource.getLength());
  var visibleMarkers = report.xMarkers.computeRange({left: 10, width: viewport.width});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 21);

  startMarkerX = 10*2 + 5*40 + 4*5 + 2.5;
  for (var i = 5, len = report.xMarkers.getLength(); i < len; ++i) {
    var marker = report.xMarkers.getXMarker(i);
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.oldDataPoint === null);
    assert(marker.animationProgress === -1);
    assert(Math.abs(marker.x - startMarkerX - (i-5)*45) < SMALL_NUM);
  }

  // Draw the content so that it covers one pixel on the far right side.
  viewport.width = 10 + 40*5 + 4*5 + 1;
  var report = chunkView.draw(viewport, 0, 20);
  assert(Math.abs(report.width - 1) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - (viewport.x+10+40*5+4*5)) < SMALL_NUM, 'invalid left offset');

  assert(report.xMarkers.getLength() === dataSource.getLength());
  var visibleMarkers = report.xMarkers.computeRange({left: 10, width: viewport.width});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 5);
  assert(report.xMarkers.getXMarker(5).x === report.left + 2.5);

  // Draw the content so that it covers one pixel on the far left side.
  var report = chunkView.draw(viewport, 10+40*15+5*15-1, 20);
  assert(Math.abs(report.width - 1) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - viewport.x) < SMALL_NUM, 'invalid left offset');

  assert(report.xMarkers.getLength() === dataSource.getLength());
  var visibleMarkers = report.xMarkers.computeRange({left: 10, width: viewport.width});
  assert(visibleMarkers.startIndex === 16);
  assert(visibleMarkers.length === 5);
  assert(report.xMarkers.getXMarker(14).x === report.left - 4 - 40 - 2.5);
}

function testDrawOffscreen() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT
  });

  var dataSource = DataSource.random(1000, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 10, 10);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {context: context, x: 10, y: 5, width: 313, height: 100};
  var report = chunkView.draw(viewport, 0, 20);
  assert(Math.abs(report.width) < SMALL_NUM, 'invalid width');
  assert(report.left === viewport.x+10+40*10+5*9, 'invalid left offset');

  assert(report.xMarkers.getLength() === dataSource.getLength());
  var visibleMarkers = report.xMarkers.computeRange({left: 10, width: 313});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 7);
  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var marker = report.xMarkers.getXMarker(i);
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.oldDataPoint === null);
    assert(marker.animationProgress === -1);
  }

  assert(Math.abs(report.xMarkers.getXMarker(0).x - viewport.x - 5) < SMALL_NUM);
  assert(Math.abs(report.xMarkers.getXMarker(1).x - viewport.x - 52.5) < SMALL_NUM);
}

function testDrawOnePoint() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    justification: BarStyle.JUSTIFY_LEFT
  });

  var dataSource = DataSource.random(1, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 0, 1);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');
  var viewport = {context: context, x: 10, y: 5, width: 313, height: 100};

  var report = chunkView.draw(viewport, 0, 20);

  assert(Math.abs(report.width - 60) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - viewport.x) < SMALL_NUM, 'invalid left');

  assert(report.xMarkers.getLength() === 1);
  var visibleMarkers = report.xMarkers.computeRange({left: 0, width: 1000});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 1);
  visibleMarkers = report.xMarkers.computeRange({left: 0, width: 1});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 0);
  visibleMarkers = report.xMarkers.computeRange({left: 1000, width: 1});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 0);
  visibleMarkers = report.xMarkers.computeRange({left: 10, width: 15});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 1);

  assert(report.xMarkers.getXMarker(0).x === viewport.x+5);

  style.setAttributes({xLabelAlignment: BarStyle.X_LABELS_RIGHT});
  chunkView = style.createChunkView(chunk, dataSource);

  var report = chunkView.draw(viewport, 0, 20);
  assert(report.xMarkers.getXMarker(0).x === viewport.x+10+40+5);
}

function testDrawNoData() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    maxElongation: Infinity
  });

  var dataSource = DataSource.random(0, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 0, 0);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');
  var viewport = {context: context, x: 10, y: 5, width: 313, height: 100};

  var report = chunkView.draw(viewport, 0, 20);

  assert(Math.abs(report.width) < SMALL_NUM, 'invalid width');
  assert(report.xMarkers.getLength() === 0);
  var visibleMarkers = report.xMarkers.computeRange({left: 0, width: 1000});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 0);
  visibleMarkers = report.xMarkers.computeRange({left: 0, width: 1});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 0);
  visibleMarkers = report.xMarkers.computeRange({left: 1000, width: 1});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 0);
}

function testDrawEmptyChunk() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    maxElongation: Infinity
  });

  var dataSource = DataSource.random(10, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 5, 0);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {context: context, x: 10, y: 5, width: 313, height: 100};

  for (var i = 1; i <= 2; ++i) {
    var report = chunkView.draw(viewport, 0, 20);
    assert(Math.abs(report.width) < SMALL_NUM, 'invalid width');

    assert(report.xMarkers.getLength() === dataSource.getLength());
    var visibleMarkers = report.xMarkers.computeRange({left: viewport.x, width: viewport.width});
    assert(visibleMarkers.startIndex === 0);
    if (i === 1) {
      assert(visibleMarkers.length === 7);
    } else {
      assert(visibleMarkers.length === 10);
    }
    for (var j = 0, len = report.xMarkers.getLength(); j < len; ++j) {
      var marker = report.xMarkers.getXMarker(j);
      assert(marker.index === j);
      assert(marker.oldIndex === j);
      assert(marker.oldDataPoint === null);
      assert(marker.animationProgress === -1);
    }

    assert(Math.abs(report.xMarkers.getXMarker(0).x - viewport.x - 5*i) < SMALL_NUM);
    assert(Math.abs(report.xMarkers.getXMarker(1).x - viewport.x - 52.5*i) < SMALL_NUM);

    viewport.width = (10*2 + 40*10 + 5*9) * 2;
  }
}

function testDrawJustifiedStretch() {
  var justifications = [
    BarStyle.JUSTIFY_LEFT,
    BarStyle.JUSTIFY_CENTER,
    BarStyle.JUSTIFY_RIGHT
  ];
  var labelStarts = [
    457.5,
    525,
    592.5
  ];
  var utilizedLeft = [
    455,
    522.5,
    590
  ];
  for (var j = 0; j < 3; ++j) {
    var style = new BarStyle({
      colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
      leftMargin: 10,
      rightMargin: 10,
      barSpacing: 5,
      barWidth: 40,
      xLabelAlignment: BarStyle.X_LABELS_LEFT,
      justification: justifications[j]
    });

    var dataSource = DataSource.random(30, 10, true);
    var chunk = dataSource.fetchChunkSync(0, 10, 10);

    var chunkView = style.createChunkView(chunk, dataSource);
    var context = new Canvas().getContext('2d');

    var viewport = {context: context, x: 10, y: 5, width: 1500, height: 100};
    var report = chunkView.draw(viewport, 0, 20);

    assert(Math.abs(report.width - 455) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - utilizedLeft[j] - viewport.x) < SMALL_NUM, 'invalid left offset');

    var visibleMarkers = report.xMarkers.computeRange({left: viewport.x, width: viewport.width});
    assert(visibleMarkers.startIndex === 0);
    assert(visibleMarkers.length === 30);
    var usedMarkers = report.xMarkers.computeRange(report);
    assert(usedMarkers.startIndex === 10);
    assert(usedMarkers.length === 11);
    for (var i = 10, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      var expectedX = labelStarts[j] + (i-10)*45 + viewport.x;
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid x marker ' + i);
      assert(marker.index === i);
      assert(marker.oldIndex === i);
      assert(marker.oldDataPoint === null);
      assert(marker.animationProgress === -1);
    }
  }
}

function testDrawElongatedStretch() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    maxElongation: Infinity
  });

  var dataSource = DataSource.random(30, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 10, 10);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {context: context, x: 10, y: 5, width: 1500, height: 100};
  var report = chunkView.draw(viewport, 0, 20);

  var stretchFactor = 1500 / (20+30*40+29*5);

  assert(Math.abs(report.width - 455*stretchFactor) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - 455*stretchFactor - viewport.x) < SMALL_NUM, 'invalid left offset');

  var visibleMarkers = report.xMarkers.computeRange({left: viewport.x, width: viewport.width});
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 30);
  var usedMarkers = report.xMarkers.computeRange(report);
  assert(usedMarkers.startIndex === 10);
  assert(usedMarkers.length === 11);
  var edgeCaseMarkers = report.xMarkers.computeRange({
    left: report.left,
    width: report.width - 2.501*stretchFactor
  });
  assert(edgeCaseMarkers.length === 10);
  edgeCaseMarkers = report.xMarkers.computeRange({
    left: report.left,
    width: report.width - 2.499*stretchFactor
  });
  assert(edgeCaseMarkers.length === 11);

  var markerSpacing = 45 * stretchFactor;
  var firstMarker = 457.5*stretchFactor;
  for (var i = 10, len = report.xMarkers.getLength(); i < len; ++i) {
    var marker = report.xMarkers.getXMarker(i);
    var expectedX = firstMarker + (i-10)*markerSpacing + viewport.x;
    assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.oldDataPoint === null);
    assert(marker.animationProgress === -1);
  }
}

function testDrawStretchEdgeCase() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 5,
    rightMargin: 5,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    maxElongation: Infinity
  });

  var dataSource = DataSource.random(30, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 0, 30);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {context: context, x: 10, y: 5, width: 1353, height: 100};
  var report = chunkView.draw(viewport, 0, 20);

  assert(Math.abs(report.width - viewport.width) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - viewport.x) < SMALL_NUM, 'invalid left offset');

  var visibleMarkers = report.xMarkers.computeRange(report);
  assert(visibleMarkers.startIndex === 0);
  assert(visibleMarkers.length === 30);

  var markerSpacing = 45;
  var firstMarker = 2.5;
  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var marker = report.xMarkers.getXMarker(i);
    var expectedX = firstMarker + i*markerSpacing + viewport.x;
    assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.oldDataPoint === null);
    assert(marker.animationProgress === -1);
  }
}

function testDrawModifying() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    justification: BarStyle.JUSTIFY_LEFT
  });

  var dataSource = DataSource.random(30, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 10, 10);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var oldPoint = chunk.getDataPoint(5);
  dataSource.modify(15, {primary: 15, secondary: -1});
  var animated = chunkView.modification(15, true);
  assert(animated);

  var viewport = {context: context, x: 10, y: 5, width: 1500, height: 100};
  for (var j = 0; j < 2; ++j) {
    currentAnimationFrameCb(j * BarChunkView.ANIMATION_DURATION / 2);

    var report = chunkView.draw(viewport, 0, 20);
    assert(Math.abs(report.width - 455) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - 455 - viewport.x) < SMALL_NUM, 'invalid left offset');

    var markerRange = report.xMarkers.computeRange({
      left: report.left,
      width: report.width - 2.501
    });
    assert(markerRange.startIndex === 10);
    assert(markerRange.length === 10);

    for (var i = 10, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      var expectedX = 457.5 + (i-10)*45 + viewport.x;
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid x marker ' + i);
      assert(marker.index === i);
      assert(marker.oldIndex === i);
      if (i === 15) {
        assert(marker.oldDataPoint === oldPoint);
        assert(Math.abs(marker.animationProgress-(j/2)) < SMALL_NUM);
      } else {
        assert(marker.oldDataPoint === null);
        assert(marker.animationProgress === -1);
      }
    }
  }
}

function testDrawDeleting() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    justification: BarStyle.JUSTIFY_LEFT
  });

  var dataSource = DataSource.random(30, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 10, 10);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var oldPoint = chunk.getDataPoint(5);
  dataSource.delete(15);
  var animated = chunkView.deletion(15, true);
  assert(animated);

  var viewport = {context: context, x: 10, y: 5, width: 1500, height: 100};

  for (var j = 0; j < 2; ++j) {
    currentAnimationFrameCb(j * BarChunkView.ANIMATION_DURATION / 2);

    var report = chunkView.draw(viewport, 0, 20);
    if (j === 0) {
      assert(Math.abs(report.width - 455) < SMALL_NUM, 'invalid width');
    } else {
      assert(Math.abs(report.width - 455 + 45/2) < SMALL_NUM, 'invalid width');
    }
    assert(Math.abs(report.left - 455 - viewport.x) < SMALL_NUM, 'invalid left offset');

    assert(report.xMarkers.getLength() === 30);
    var usedRange = report.xMarkers.computeRange({
      left: report.left,
      width: report.width - 2.501
    });
    assert(usedRange.startIndex === 10);
    assert(usedRange.length === 10);
    var visibleRange = report.xMarkers.computeRange({left: viewport.x, width: viewport.width});
    assert(visibleRange.startIndex === 0);
    assert(visibleRange.length === 30);

    for (var i = 10, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      var expectedX = 457.5 + (i-10)*45 + viewport.x;
      if (j === 1) {
        if (i === 15) {
          expectedX -= 2.5 / 4;
        } else if (i === 16) {
          expectedX -= 45/2 - 2.5/4;
        } else if (i > 16) {
          expectedX -= 45 / 2;
        }
      }
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid x marker ' + i);
      if (i > 15) {
        assert(marker.index === i-1);
      } else if (i === 15) {
        assert(marker.index === -1);
      } else if (i < 15) {
        assert(marker.index === i);
      }
      assert(marker.oldIndex === i);
      if (i === 15) {
        assert(marker.oldDataPoint === oldPoint);
      } else {
        assert(marker.oldDataPoint === null);
      }
      if (i === 15) {
        assert(marker.animationProgress === j/2);
      } else {
        assert(marker.animationProgress === -1);
      }
    }
  }
}

function testDrawInserting() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    justification: BarStyle.JUSTIFY_LEFT
  });

  var dataSource = DataSource.random(29, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 10, 9);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  dataSource.insert(15, {primary: 15, secondary: -1});
  var animated = chunkView.insertion(15, true);
  assert(animated);

  var viewport = {context: context, x: 10, y: 5, width: 1500, height: 100};

  for (var j = 0; j < 2; ++j) {
    currentAnimationFrameCb(j * BarChunkView.ANIMATION_DURATION / 2);

    var report = chunkView.draw(viewport, 0, 20);
    if (j === 0) {
      assert(Math.abs(report.width - 410) < SMALL_NUM, 'invalid width');
    } else {
      assert(Math.abs(report.width - 455 + 45/2) < SMALL_NUM, 'invalid width');
    }
    assert(Math.abs(report.left - 455 - viewport.x) < SMALL_NUM, 'invalid left offset');

    assert(report.xMarkers.getLength() === 30);
    var usedRange = report.xMarkers.computeRange({
      left: report.left,
      width: report.width - 2.501
    });
    assert(usedRange.startIndex === 10);
    assert(usedRange.length === 10);
    var visibleRange = report.xMarkers.computeRange({left: viewport.x, width: viewport.width});
    assert(visibleRange.startIndex === 0);
    assert(visibleRange.length === 30);

    for (var i = 10, len = report.xMarkers.getLength(); i < len; ++i) {
      var marker = report.xMarkers.getXMarker(i);
      var expectedX = 457.5 + (i-10)*45 + viewport.x;
      if (j === 1) {
        if (i === 15) {
          expectedX -= 2.5 / 4;
        } else if (i === 16) {
          expectedX -= 45/2 - 2.5/4;
        } else if (i > 16) {
          expectedX -= 45 / 2;
        }
      } else {
        if (i === 15) {
          expectedX -= 2.5 / 2;
        } else if (i === 16) {
          expectedX -= 45 - 2.5/2;
        } else if (i > 16) {
          expectedX -= 45;
        }
      }
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
      if (i > 15) {
        assert(marker.oldIndex === i-1);
      } else if (i === 15) {
        assert(marker.oldIndex === -1);
      } else if (i < 15) {
        assert(marker.oldIndex === i);
      }
      assert(marker.index === i);
      assert(marker.oldDataPoint === null);
      if (i === 15) {
        assert(marker.animationProgress === j/2);
      } else {
        assert(marker.animationProgress === -1);
      }
    }
  }
}

function testBlurbsNormal() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    justification: BarStyle.JUSTIFY_LEFT
  });

  var dataSource = DataSource.random(30, 10, false);
  dataSource.insert(0, {primary: 15, secondary: 10});
  var chunk = dataSource.fetchChunkSync(0, 0, 30);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {
    context: context,
    x: 10,
    y: 5,
    width: 500,
    height: 100,
    fullX: 0,
    fullY: 0,
    fullWidth: 510,
    fullHeight: 105
  };

  chunkView.pointerMove({x: 21, y: 105 - 75 + SMALL_NUM});
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(0);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(2000);
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);

  var blurb = chunkView._blurbManager._currentBlurb;
  assert(blurb !== null);
  assert(Math.abs(blurb._point.x - 40) < SMALL_NUM);
  assert(Math.abs(blurb._point.y - 30) < SMALL_NUM);
  assert.equal(blurb._text, ''+chunk.getDataPoint(0).primary);

  chunkView.pointerMove({x: 21, y: 105 - 55});
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);
  assert.equal(blurb, chunkView._blurbManager._currentBlurb);

  // NOTE: first the old blurb fades out, then the new one fades in.
  chunkView.pointerMove({x: 21, y: 105-50+SMALL_NUM});
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(0);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(2000);
  assert.equal(chunkView._blurbManager._currentBlurb, null);
  chunkView.draw(viewport, 0, 20);
  assert(chunkView._blurbManager._currentBlurb !== null);
  callAnimationFrameCb(2000);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(4000);
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);

  blurb = chunkView._blurbManager._currentBlurb;
  assert(blurb !== null);
  assert(Math.abs(blurb._point.x - 40) < SMALL_NUM);
  assert(Math.abs(blurb._point.y - 55) < SMALL_NUM);
  assert.equal(blurb._text, ''+chunk.getDataPoint(0).secondary);

  chunkView.pointerMove({x: 21, y: 105 - 30});
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);
  assert.equal(blurb, chunkView._blurbManager._currentBlurb);

  chunkView.pointerMove({x: 21, y: 10});
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(0);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(2000);
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);

  assert(chunkView._blurbManager._currentBlurb === null);
}

function testBlurbsElongated() {
  var style = new BarStyle({
    colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 40,
    xLabelAlignment: BarStyle.X_LABELS_LEFT,
    maxElongation: Infinity
  });

  var dataSource = DataSource.random(2, 10, false);
  dataSource.insert(1, {primary: 15, secondary: -1});
  dataSource.insert(2, {primary: 13, secondary: -1});
  dataSource.insert(3, {primary: 12, secondary: -1});
  var chunk = dataSource.fetchChunkSync(0, 1, 3);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {
    context: context,
    x: 10,
    y: 5,
    width: 500,
    height: 100,
    fullX: 0,
    fullY: 0,
    fullWidth: 510,
    fullHeight: 105
  };

  var stretchFactor = (500 / 240);

  chunkView.pointerMove({x: 10+(10+40+6)*stretchFactor, y: 105 - 75 + SMALL_NUM});
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(0);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(2000);
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);

  var blurb = chunkView._blurbManager._currentBlurb;
  assert(blurb !== null);
  assert(Math.abs(blurb._point.x - (10+(10+40+5+20)*stretchFactor)) < SMALL_NUM);
  assert(Math.abs(blurb._point.y - 30) < SMALL_NUM);
  assert.equal(blurb._text, ''+chunk.getDataPoint(0).primary);

  chunkView.pointerMove({x: 10+(10+40+5+39)*stretchFactor, y: 105 - 55});
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);
  assert.equal(blurb, chunkView._blurbManager._currentBlurb);

  // NOTE: first the old blurb fades out, then the new one fades in.
  chunkView.pointerMove({x: 10+(10+40*2+5+6)*stretchFactor, y: 105-65+SMALL_NUM});
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(0);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(2000);
  assert.equal(chunkView._blurbManager._currentBlurb, null);
  chunkView.draw(viewport, 0, 20);
  assert(chunkView._blurbManager._currentBlurb !== null);
  callAnimationFrameCb(2000);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(4000);
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);

  blurb = chunkView._blurbManager._currentBlurb;
  assert(blurb !== null);
  assert(Math.abs(blurb._point.x - (10+(10+40*2+5*2+20)*stretchFactor)) < SMALL_NUM);
  assert(Math.abs(blurb._point.y - 40) < SMALL_NUM);
  assert.equal(blurb._text, ''+chunk.getDataPoint(1).primary);

  chunkView.pointerMove({x: 10+(10+40*3+4+5)*stretchFactor, y: 105-65+SMALL_NUM});
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);
  assert.equal(blurb, chunkView._blurbManager._currentBlurb);

  chunkView.pointerMove({x: 10+(10+40*3+6+5)*stretchFactor, y: 105-65+SMALL_NUM});
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(0);
  chunkView.draw(viewport, 0, 20);
  callAnimationFrameCb(2000);
  chunkView.draw(viewport, 0, 20);
  assert.equal(currentAnimationFrameCb, null);

  assert(chunkView._blurbManager._currentBlurb === null);
}

testWidth();
testDrawBestCase();
testDrawBasicScrolling();
testDrawEdgeCases();
testDrawOffscreen();
testDrawOnePoint();
testDrawNoData();
testDrawEmptyChunk();
testDrawJustifiedStretch();
testDrawElongatedStretch();
testDrawStretchEdgeCase();
testDrawModifying();
testDrawDeleting();
testDrawInserting();
testBlurbsNormal();
testBlurbsElongated();

console.log('PASS');
