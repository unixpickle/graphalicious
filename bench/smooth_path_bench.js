var bench = require('./bench.js');
var fs = require('fs');

var smoothPath = (function() {
  var code = fs.readFileSync(__dirname + '/../src/styles/smooth_path.js')
  code = '(function() {' + code + 'return smoothPath;})();';
  return eval(code);
})();

function benchSmoothPath(inCount, width) {
  var spacing = width / (inCount - 1);
  var inputPoints = [];
  for (var i = 0; i < inCount; ++i) {
    inputPoints.push({x: i*spacing, y: Math.random() * 400});
  }
  bench('smoothPath [' + inCount + ' in, ' + width + ' out]', function(count) {
    while (count--) {
      smoothPath(inputPoints, 1);
    }
  });
}

benchSmoothPath(20, 1000);
benchSmoothPath(100, 1000);
benchSmoothPath(400, 2000);
