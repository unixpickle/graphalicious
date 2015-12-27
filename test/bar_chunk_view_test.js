var SMALL_NUM = 0.001;

var assert = require('assert');

var DataSource = require(__dirname + '/data_source.js');
var Canvas = require(__dirname + '/dummy_canvas.js');

var currentAnimationFrameCb;

var importRes = require('./importer')([
  'base/color_scheme.js', 'base/attrs.js', 'styles/bar_style.js',
  'styles/bar_morphing.js', 'styles/bar_chunk_view.js', 'styles/utilities.js'
], ['BarStyle', 'ColorScheme', 'BarChunkView'], {
  window: {
    requestAnimationFrame: function(f) {
      currentAnimationFrameCb = f;
      return 0;
    },
    cancelAnimationFrame: function() {
      currentAnimationFrameCb = null;
    },
    EventEmitter: require('events').EventEmitter
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
    [BarStyle.X_LABELS_LEFT, 5, 52.5],
    [BarStyle.X_LABELS_CENTER, 30, 75],
    [BarStyle.X_LABELS_RIGHT, 52.5, 97.5]
  ];

  for (var j = 0; j < 3; ++j) {
    var xInfo = xLabelOffsets[j];

    var style = new BarStyle({
      colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
      leftMargin: 10,
      rightMargin: 10,
      barSpacing: 5,
      barWidth: 40,
      xLabelAlignment: xInfo[0]
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

    assert(report.xmarkers.length === 7);
    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      assert(marker.index === i);
      assert(marker.oldIndex === i);
      assert(marker.dataPoint === chunk.getDataPoint(i));
      assert(marker.oldDataPoint === chunk.getDataPoint(i));
      assert(marker.visibility === 1);
    }

    var firstXValue = xInfo[1] + viewport.x;
    assert(Math.abs(report.xmarkers[0].x - firstXValue) < SMALL_NUM, 'invalid x for xmarkers[0]');

    for (var i = 1, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      var xValue = viewport.x + xInfo[2] + (i-1)*45;
      assert(Math.abs(marker.x - xValue) < SMALL_NUM, 'invalid x for xmarkers[' + i + ']');
    }
  }
}

function testDrawBasicScrolling() {
  var xLabelOffsets = [
    [BarStyle.X_LABELS_LEFT, 5, 52.5],
    [BarStyle.X_LABELS_CENTER, 30, 75],
    [BarStyle.X_LABELS_RIGHT, 52.5, 97.5]
  ];

  for (var j = 0; j < 3; ++j) {
    var xInfo = xLabelOffsets[j];

    var style = new BarStyle({
      colorScheme: new ColorScheme('#65bcd4', '#325e6a'),
      leftMargin: 10,
      rightMargin: 10,
      barSpacing: 5,
      barWidth: 40,
      xLabelAlignment: xInfo[0]
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

    assert(report.xmarkers.length === 7);
    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      assert(marker.index === i);
      assert(marker.oldIndex === i);
      assert(marker.dataPoint === chunk.getDataPoint(i));
      assert(marker.oldDataPoint === chunk.getDataPoint(i));
      assert(marker.visibility === 1);
    }

    var firstXValue = xInfo[1] + viewport.x - 3;
    assert(Math.abs(report.xmarkers[0].x - firstXValue) < SMALL_NUM, 'invalid x for xmarkers[0]');

    for (var i = 1, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      var xValue = viewport.x + xInfo[2] + (i-1)*45 - 3;
      assert(Math.abs(marker.x - xValue) < SMALL_NUM, 'invalid x for xmarkers[' + i + ']');
    }

    var report = chunkView.draw(viewport, 51, 20);
    assert(Math.abs(report.width - 313) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

    assert(report.xmarkers.length === 7);
    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      assert(marker.index === i+1);
      assert(marker.oldIndex === i+1);
      assert(marker.dataPoint === chunk.getDataPoint(i+1));
      assert(marker.oldDataPoint === chunk.getDataPoint(i+1));
      assert(marker.visibility === 1);
    }

    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      var xValue = viewport.x + xInfo[2] + i*45 - 51;
      assert(Math.abs(marker.x - xValue) < SMALL_NUM, 'invalid x for xmarkers[' + i + ']');
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

  assert(report.xmarkers.length === 2);
  for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
    var marker = report.xmarkers[i];
    assert(marker.index === i+5);
    assert(marker.oldIndex === i+5);
    assert(marker.dataPoint === chunk.getDataPoint(i));
    assert(marker.oldDataPoint === chunk.getDataPoint(i));
    assert(marker.visibility === 1);
  }

  assert(Math.abs(report.xmarkers[0].x - (10+40*5+5*4+2.5)) < SMALL_NUM);
  assert(Math.abs(report.xmarkers[1].x - (10+40*6+5*5+2.5)) < SMALL_NUM);

  // Draw the content so it barely fills the entire viewport.

  report = chunkView.draw(viewport, 10+40*5+5*4+1, 20);
  assert(Math.abs(report.width - 313) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

  assert(report.xmarkers.length === 7);
  var startMarkerX = 10 + 2.5 - 1;
  for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
    var marker = report.xmarkers[i];
    assert(marker.index === i + 5);
    assert(marker.oldIndex === i + 5);
    assert(marker.dataPoint === chunk.getDataPoint(i));
    assert(marker.oldDataPoint === chunk.getDataPoint(i));
    assert(marker.visibility === 1);
    assert(Math.abs(marker.x - startMarkerX - i*45) < SMALL_NUM);
  }

  // Draw the content so it does not fill the right part of the viewport.

  report = chunkView.draw(viewport, (15*40+5*15+10) - 111, 20);
  assert(Math.abs(report.width - 111) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - 10) < SMALL_NUM, 'invalid left offset');

  assert(report.xmarkers.length === 3);
  startMarkerX = -16.5;
  for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
    var marker = report.xmarkers[i];
    assert(marker.index === i + 12);
    assert(marker.oldIndex === i + 12);
    assert(marker.dataPoint === chunk.getDataPoint(i + 7));
    assert(marker.oldDataPoint === chunk.getDataPoint(i + 7));
    assert(marker.visibility === 1);
    assert(Math.abs(marker.x - startMarkerX - i*45) < SMALL_NUM);
  }

  // Draw the content so that it only fills the middle of the viewport.

  viewport.width = 10 + 20*40 + 20*5;
  report = chunkView.draw(viewport, 0, 20);

  assert(Math.abs(report.width - (11*5 + 10*40)) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - (10*2 + 40*5 + 5*4)) < SMALL_NUM, 'invalid left offset');

  assert(report.xmarkers.length === 10);
  startMarkerX = 10*2 + 5*40 + 4*5 + 2.5;
  for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
    var marker = report.xmarkers[i];
    assert(marker.index === i + 5);
    assert(marker.oldIndex === i + 5);
    assert(marker.dataPoint === chunk.getDataPoint(i));
    assert(marker.oldDataPoint === chunk.getDataPoint(i));
    assert(marker.visibility === 1);
    assert(Math.abs(marker.x - startMarkerX - i*45) < SMALL_NUM);
  }

  // Draw the content so that it covers one pixel on the far left side.

  viewport.width = 10 + 40*5 + 4*5 + 1;
  var report = chunkView.draw(viewport, 0, 20);
  assert(Math.abs(report.width - 1) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - (viewport.x+10+40*5+4*5)) < SMALL_NUM, 'invalid left offset');

  assert(report.xmarkers.length === 1);
  assert(report.xmarkers[0].index === 5);
  assert(report.xmarkers[0].oldIndex === 5);
  assert(report.xmarkers[0].dataPoint === chunk.getDataPoint(0));
  assert(report.xmarkers[0].oldDataPoint === chunk.getDataPoint(0));
  assert(report.xmarkers[0].visibility === 1);
  assert(report.xmarkers[0].x === report.left + 2.5);

  // Draw the content so that it covers one pixel on the far right side.
  var report = chunkView.draw(viewport, 10+40*15+5*15-1, 20);
  assert(Math.abs(report.width - 1) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - viewport.x) < SMALL_NUM, 'invalid left offset');

  assert(report.xmarkers.length === 1);
  assert(report.xmarkers[0].index === 14);
  assert(report.xmarkers[0].oldIndex === 14);
  assert(report.xmarkers[0].dataPoint === chunk.getDataPoint(9));
  assert(report.xmarkers[0].oldDataPoint === chunk.getDataPoint(9));
  assert(report.xmarkers[0].visibility === 1);
  assert(report.xmarkers[0].x === report.left - 4 - 40 - 2.5);
}

function testDrawJustifiedStretch() {
  var stretchModes = [
    BarStyle.STRETCH_MODE_JUSTIFY_LEFT,
    BarStyle.STRETCH_MODE_JUSTIFY_CENTER,
    BarStyle.STRETCH_MODE_JUSTIFY_RIGHT
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
      stretchMode: stretchModes[j]
    });

    var dataSource = DataSource.random(30, 10, true);
    var chunk = dataSource.fetchChunkSync(0, 10, 10);

    var chunkView = style.createChunkView(chunk, dataSource);
    var context = new Canvas().getContext('2d');

    var viewport = {context: context, x: 10, y: 5, width: 1500, height: 100};
    var report = chunkView.draw(viewport, 0, 20);

    assert(Math.abs(report.width - 455) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - utilizedLeft[j] - viewport.x) < SMALL_NUM, 'invalid left offset');

    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      var expectedX = labelStarts[j] + i*45 + viewport.x;
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
      assert(marker.index === i + 10);
      assert(marker.oldIndex === i + 10);
      assert(marker.dataPoint === chunk.getDataPoint(i));
      assert(marker.oldDataPoint === chunk.getDataPoint(i));
      assert(marker.visibility === 1);
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
    stretchMode: BarStyle.STRETCH_MODE_ELONGATE
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

  var markerSpacing = 45 * stretchFactor;
  var firstMarker = 457.5*stretchFactor;
  for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
    var marker = report.xmarkers[i];
    var expectedX = firstMarker + i*markerSpacing + viewport.x;
    assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
    assert(marker.index === i + 10);
    assert(marker.oldIndex === i + 10);
    assert(marker.dataPoint === chunk.getDataPoint(i));
    assert(marker.oldDataPoint === chunk.getDataPoint(i));
    assert(marker.visibility === 1);
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
    stretchMode: BarStyle.STRETCH_MODE_ELONGATE
  });

  var dataSource = DataSource.random(30, 10, true);
  var chunk = dataSource.fetchChunkSync(0, 0, 30);

  var chunkView = style.createChunkView(chunk, dataSource);
  var context = new Canvas().getContext('2d');

  var viewport = {context: context, x: 10, y: 5, width: 1353, height: 100};
  var report = chunkView.draw(viewport, 0, 20);

  assert(Math.abs(report.width - viewport.width) < SMALL_NUM, 'invalid width');
  assert(Math.abs(report.left - viewport.x) < SMALL_NUM, 'invalid left offset');
  assert.equal(report.xmarkers.length, 30, 'invalid marker count');

  var markerSpacing = 45;
  var firstMarker = 2.5;
  for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
    var marker = report.xmarkers[i];
    var expectedX = firstMarker + i*markerSpacing + viewport.x;
    assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
    assert(marker.index === i);
    assert(marker.oldIndex === i);
    assert(marker.dataPoint === chunk.getDataPoint(i));
    assert(marker.oldDataPoint === chunk.getDataPoint(i));
    assert(marker.visibility === 1);
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
    stretchMode: BarStyle.STRETCH_MODE_JUSTIFY_LEFT
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
    assert(report.xmarkers.length === 10);
    assert(Math.abs(report.width - 455) < SMALL_NUM, 'invalid width');
    assert(Math.abs(report.left - 455 - viewport.x) < SMALL_NUM, 'invalid left offset');

    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      var expectedX = 457.5 + i*45 + viewport.x;
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
      assert(marker.index === i + 10);
      assert(marker.oldIndex === i + 10);
      assert(marker.dataPoint === chunk.getDataPoint(i));
      if (i === 5) {
        assert(marker.oldDataPoint === oldPoint);
      } else {
        assert(marker.oldDataPoint === chunk.getDataPoint(i));
      }
      assert(marker.visibility === 1);
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
    stretchMode: BarStyle.STRETCH_MODE_JUSTIFY_LEFT
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
    assert(report.xmarkers.length === 10);
    if (j === 0) {
      assert(Math.abs(report.width - 455) < SMALL_NUM, 'invalid width');
    } else {
      assert(Math.abs(report.width - 455 + 45/2) < SMALL_NUM, 'invalid width');
    }
    assert(Math.abs(report.left - 455 - viewport.x) < SMALL_NUM, 'invalid left offset');

    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      var expectedX = 457.5 + i*45 + viewport.x;
      if (j === 1) {
        if (i === 5) {
          expectedX -= 2.5 / 4;
        } else if (i === 6) {
          expectedX -= 45/2 - 2.5/4;
        } else if (i > 6) {
          expectedX -= 45 / 2;
        }
      }
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
      if (i > 5) {
        assert(marker.index === i + 9);
      } else if (i === 5) {
        assert(marker.index === -1);
      } else if (i < 5) {
        assert(marker.index === i + 10);
      }
      assert(marker.oldIndex === i + 10);
      if (i === 5) {
        assert(marker.dataPoint === null);
        assert(marker.oldDataPoint === oldPoint);
      } else if (i < 5) {
        assert(marker.dataPoint === chunk.getDataPoint(i));
        assert(marker.oldDataPoint === chunk.getDataPoint(i));
      } else if (i > 5) {
        assert(marker.dataPoint === chunk.getDataPoint(i - 1));
        assert(marker.oldDataPoint === chunk.getDataPoint(i - 1));
      }
      if (i === 5) {
        assert(marker.visibility === 1-(j/2));
      } else {
        assert(marker.visibility === 1);
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
    stretchMode: BarStyle.STRETCH_MODE_JUSTIFY_LEFT
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
    assert(report.xmarkers.length === 10);
    if (j === 0) {
      assert(Math.abs(report.width - 410) < SMALL_NUM, 'invalid width');
    } else {
      assert(Math.abs(report.width - 455 + 45/2) < SMALL_NUM, 'invalid width');
    }
    assert(Math.abs(report.left - 455 - viewport.x) < SMALL_NUM, 'invalid left offset');

    for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
      var marker = report.xmarkers[i];
      var expectedX = 457.5 + i*45 + viewport.x;
      if (j === 1) {
        if (i === 5) {
          expectedX -= 2.5 / 4;
        } else if (i === 6) {
          expectedX -= 45/2 - 2.5/4;
        } else if (i > 6) {
          expectedX -= 45 / 2;
        }
      } else {
        if (i === 5) {
          expectedX -= 2.5 / 2;
        } else if (i === 6) {
          expectedX -= 45 - 2.5/2;
        } else if (i > 6) {
          expectedX -= 45;
        }
      }
      assert(Math.abs(marker.x - expectedX) < SMALL_NUM, 'invalid xmarker[' + i + '].x');
      if (i > 5) {
        assert(marker.oldIndex === i + 9);
      } else if (i === 5) {
        assert(marker.oldIndex === -1);
      } else if (i < 5) {
        assert(marker.oldIndex === i + 10);
      }
      assert(marker.index === i + 10);
      assert(marker.dataPoint === chunk.getDataPoint(i));
      if (i === 5) {
        assert(marker.oldDataPoint === null);
      } else {
        assert(marker.oldDataPoint === chunk.getDataPoint(i));
      }
      if (i === 5) {
        assert(marker.visibility === j/2);
      } else {
        assert(marker.visibility === 1);
      }
    }
  }
}

testWidth();
testDrawBestCase();
testDrawBasicScrolling();
testDrawEdgeCases();
testDrawJustifiedStretch();
testDrawElongatedStretch();
testDrawStretchEdgeCase();
testDrawModifying();
testDrawDeleting();
testDrawInserting();

console.log('PASS');
