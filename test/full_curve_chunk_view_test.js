var SMALL_NUM = 0.001;
var assert = require('assert');

var DataSource = require('./data_source.js');
var DummyCanvas = require('./dummy_canvas.js');

var importRes = require('./importer')([
  'base/event_emitter.js', 'base/color_scheme.js', 'styles/utilities.js',
  'styles/smooth_path.js', 'styles/attrs.js', 'styles/full_curve_style.js',
  'styles/full_curve_chunk_view.js'
], ['FullCurveStyle', 'ColorScheme']);

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
  assert.equal(report.xmarkers.length, pointCount);

  for (var i = 0, len = report.xmarkers.length; i < len; ++i) {
    var m = report.xmarkers[i];
    assert.equal(m.index, i);
    assert.equal(m.oldIndex, i);
    assert.equal(m.dataPoint, chunk.getDataPoint(i));
    assert.equal(m.oldDataPoint, chunk.getDataPoint(i));
    assert.equal(m.visibility, 1);
    assertAboutEqual(m.x, 13+7+spacing*i);
  }
}

testDrawCompleteScrolling();
console.log('PASS');
