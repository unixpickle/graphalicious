var SMALL_NUM = 0.001;
var assert = require('assert');

var DataSource = require('./data_source.js');
var DummyCanvas = require('./dummy_canvas.js');

var importRes = require('./importer')([
  'base/color_scheme.js', 'styles/utilities.js',
  'styles/smooth_path.js', 'base/attrs.js', 'styles/full_curve_style.js',
  'styles/full_curve_chunk_view.js', 'styles/full_curve_xmarkers.js'
], ['FullCurveStyle', 'ColorScheme'], {
  window: {
    EventEmitter: require('events').EventEmitter
  },
  EventEmitter: require('events').EventEmitter
});

var FullCurveStyle = importRes.FullCurveStyle;
var ColorScheme = importRes.ColorScheme;

function assertAboutEqual(a, b, msg) {
  assert(Math.abs(a-b) < SMALL_NUM, msg);
}

function testDrawCompleteScrolling() {
  var style = new FullCurveStyle({
    leftMargin: 7,
    rightMargin: 9,
    minWidth: 50,
    colorScheme: new ColorScheme('red', 'blue')
  });

  var dataSource = DataSource.random(100, 30, true);
  var chunk = dataSource.fetchChunkSync(0, 0, 100);

  var viewport = {
    x: 13,
    y: 10,
    width: 30,
    height: 50,
    context: new DummyCanvas().getContext('2d')
  };
  var chunkView = style.createChunkView(chunk, dataSource);
  var report = chunkView.draw(viewport, 0, 40);

  assertAboutEqual(report.left, 13);
  assertAboutEqual(report.width, 30);
  var spacing = 34 / (dataSource.getLength() - 1);
  var pointCount = Math.ceil(23 / spacing);

  var visibleRange = report.xMarkers.computeRange(report);
  assert.equal(visibleRange.length, pointCount);
  assert.equal(report.xMarkers.getLength(), dataSource.getLength());

  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i);
  }

  report = chunkView.draw(viewport, 20, 40);

  assertAboutEqual(report.left, 13);
  assertAboutEqual(report.width, 30);

  pointCount = Math.ceil(21 / spacing);
  var missingPoints = dataSource.getLength() - pointCount;

  var visibleRange = report.xMarkers.computeRange(report);
  assert.equal(visibleRange.startIndex, missingPoints);
  assert.equal(visibleRange.length, pointCount);
  assert.equal(report.xMarkers.getLength(), dataSource.getLength());

  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i-20);
  }

  report = chunkView.draw(viewport, 10, 40);

  assertAboutEqual(report.left, 13);
  assertAboutEqual(report.width, 30);

  var firstPointIndex = Math.ceil(3 / spacing);
  var lastPointIndex = Math.floor(33 / spacing);
  pointCount = lastPointIndex - firstPointIndex + 1;

  var visibleRange = report.xMarkers.computeRange(report);
  assert.equal(visibleRange.startIndex, firstPointIndex);
  assert.equal(visibleRange.length, pointCount);
  assert.equal(report.xMarkers.getLength(), dataSource.getLength());

  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i-10);
  }
}

function testDrawCompleteStretched() {
  var style = new FullCurveStyle({
    leftMargin: 7,
    rightMargin: 9,
    minWidth: 50,
    colorScheme: new ColorScheme('red', 'blue')
  });

  var dataSource = DataSource.random(100, 30, true);
  var chunk = dataSource.fetchChunkSync(0, 0, 100);

  var viewport = {
    x: 13,
    y: 10,
    width: 60,
    height: 50,
    context: new DummyCanvas().getContext('2d')
  };
  var chunkView = style.createChunkView(chunk, dataSource);
  var report = chunkView.draw(viewport, 0, 40);

  assertAboutEqual(report.left, 13);
  assertAboutEqual(report.width, 60);

  var visibleRegion = report.xMarkers.computeRange(report);
  assert.equal(visibleRegion.startIndex, 0);
  assert.equal(visibleRegion.length, dataSource.getLength());

  var spacing = (60 - 7 - 9) / (dataSource.getLength() - 1);
  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i);
  }
}

function testDrawPartialScrolling() {
  var style = new FullCurveStyle({
    leftMargin: 7,
    rightMargin: 9,
    minWidth: 50,
    colorScheme: new ColorScheme('red', 'blue')
  });

  var dataSource = DataSource.random(100, 30, true);
  var chunk = dataSource.fetchChunkSync(0, 1, 98);

  var viewport = {
    x: 13,
    y: 10,
    width: 30,
    height: 50,
    context: new DummyCanvas().getContext('2d')
  };
  var chunkView = style.createChunkView(chunk, dataSource);

  var report = chunkView.draw(viewport, 0, 40);
  var spacing = 34 / (dataSource.getLength() - 1);

  assertAboutEqual(report.left, 13+7+spacing);
  assertAboutEqual(report.width, 30-7-spacing);
  var pointCount = Math.ceil(23 / spacing) - 1;
  var visibleRange = report.xMarkers.computeRange(report);
  assert.equal(visibleRange.startIndex, 1);
  assert.equal(visibleRange.length, pointCount);

  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i);
  }

  report = chunkView.draw(viewport, 20, 40);

  assertAboutEqual(report.left, 13);
  assertAboutEqual(report.width, 30-9-spacing);

  pointCount = Math.ceil(21 / spacing) - 1;
  var startIndex = dataSource.getLength() - (pointCount + 1);

  var visibleRange = report.xMarkers.computeRange(report);
  assert.equal(visibleRange.startIndex, startIndex);
  assert.equal(visibleRange.length, pointCount);
  assert.equal(report.xMarkers.getLength(), dataSource.getLength());

  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i-20);
  }

  report = chunkView.draw(viewport, 10, 40);

  assertAboutEqual(report.left, 13);
  assertAboutEqual(report.width, 30);

  var firstPointIndex = Math.ceil(3 / spacing);
  var lastPointIndex = Math.floor(33 / spacing);
  pointCount = lastPointIndex - firstPointIndex + 1;

  var visibleRange = report.xMarkers.computeRange(report);
  assert.equal(visibleRange.startIndex, firstPointIndex);
  assert.equal(visibleRange.length, pointCount);
  assert.equal(report.xMarkers.getLength(), dataSource.getLength());

  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i-10);
  }
}

function testDrawPartialStretched() {
  var style = new FullCurveStyle({
    leftMargin: 7,
    rightMargin: 9,
    minWidth: 50,
    colorScheme: new ColorScheme('red', 'blue')
  });

  var dataSource = DataSource.random(100, 30, true);
  var chunk = dataSource.fetchChunkSync(0, 1, 98);

  var viewport = {
    x: 13,
    y: 10,
    width: 60,
    height: 50,
    context: new DummyCanvas().getContext('2d')
  };
  var chunkView = style.createChunkView(chunk, dataSource);
  var report = chunkView.draw(viewport, 0, 40);

  var spacing = (60 - 7 - 9) / (dataSource.getLength() - 1);
  assertAboutEqual(report.left, 13+7+spacing);
  assertAboutEqual(report.width, 60-9-spacing*2-7);

  var visibleRange = report.xMarkers.computeRange(report);
  assert.equal(visibleRange.startIndex, 1);
  assert.equal(visibleRange.length, dataSource.getLength()-2);
  assert.equal(report.xMarkers.getLength(), dataSource.getLength());

  var interestingRange = report.xMarkers.computeRange({
    left: report.left+SMALL_NUM,
    width: report.width-SMALL_NUM
  });
  assert.equal(interestingRange.startIndex, 2);
  assert.equal(interestingRange.length, dataSource.getLength()-3);

  for (var i = 0, len = report.xMarkers.getLength(); i < len; ++i) {
    var m = report.xMarkers.getXMarker(i);
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.oldDataPoint, null);
    assert.equal(m.animationProgress, -1);
    assertAboutEqual(m.x, 13+7+spacing*i);
  }
}

testDrawCompleteScrolling();
testDrawCompleteStretched();
testDrawPartialScrolling();
testDrawPartialStretched();

console.log('PASS');
