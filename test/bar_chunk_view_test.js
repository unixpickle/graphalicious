var SMALL_NUM = 0.001;

var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var fs = require('fs');

var DataSource = require(__dirname + '/data_source.js');
var Canvas = require(__dirname + '/dummy_canvas.js');

var BarStyle;
var ColorScheme;

(function() {
  var files = ['base/color_scheme.js', 'styles/bar_style.js', 'styles/bar_morphing.js',
    'styles/bar_chunk_view.js'];
  var codeBody = '';
  for (var i = 0, len = files.length; i < len; ++i) {
    codeBody += fs.readFileSync(__dirname + '/../src/' + files[i]);
  }
  var code = '(function() {var exports = {};' + codeBody + ';return exports;})()';
  var res = eval(code);
  ColorScheme = res.ColorScheme;
  BarStyle = res.BarStyle;
})();

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

testDrawBestCase();

console.log('PASS');
