var SMALL_NUM = 0.0001;

// smoothPath generates a smooth curve through a list of points.
// The points (objects with x and y attributes) should be sorted in ascending x-axis order.
// This returns an array of points in ascending x-axis order.
function smoothPath(points, outputPointSpace) {
  // FYI: this uses a monotone cubic spline to generate a smooth curve.

  points = removeOverlappingPoints(points);
  var len = points.length;

  if (len === 0) {
    return [];
  } else if (len === 1) {
    return [points[0]];
  }

  var dxList = [];
  var dyList = [];
  var slopes = [];
  for (var i = 0; i < len-1; ++i) {
    dxList[i] = points[i+1].x - points[i].x;
    dyList[i] = points[i+1].y - points[i].y;
    slopes[i] = dyList[i] / dxList[i];
  }

  // Get coefficients for the "x" term (i.e. the linear term).
  var deg1 = [slopes[0]];
  for (var i = 0; i < len-2; ++i) {
    var slope = slopes[i];
    var nextSlope = slopes[i+1];

    if (slope*nextSlope <= 0) {
      // NOTE: to keep monotonicity, this needs to be flat.
      deg1[i+1] = 0;
      continue;
    }

    var dx = dxList[i];
    var nextDx = dxList[i+1];
    var common = dx + nextDx;
    deg1[i+1] = 3 * common / ((common+nextDx)/slope + (common+dx)/nextSlope);
  }

  // NOTE: we need to do this for generating the higher-degree coefficients.
  deg1.push(slopes[slopes.length-1]);

  // Generate second- and third-degree coefficients.
  var deg2 = [];
  var deg3 = [];
  for (var i = 0; i < len-1; ++i) {
    var c1 = deg1[i];
    var slope = slopes[i];
    var invDx = 1 / dxList[i];
    var common = c1 + deg1[i+1] - 2*slope;
    deg2[i] = (slope - c1 - common) * invDx;
    deg3[i] = common * invDx * invDx;
  }

  var result = [];
  var currentPointX = points[0].x;
  for (var i = 0; i < len-1; ++i) {
    var nextX = points[i+1].x;
    var translate = points[i].x;
    var c0 = points[i].y;
    var c1 = deg1[i];
    var c2 = deg2[i];
    var c3 = deg3[i];
    while (currentPointX < nextX) {
      var x = currentPointX - translate;
      var x2 = x * x;
      var x3 = x2 * x;
      result.push({x: currentPointX, y: c0 + c1*x + c2*x2 + c3*x3});
      currentPointX += outputPointSpace;
    }
  }
  result.push(points[len-1]);
  return result;
}

function removeOverlappingPoints(points) {
  points = points.slice();
  for (var i = 1; i < points.length; ++i) {
    if (points[i-1].x + SMALL_NUM > points[i].x) {
      points.splice(i, 1);
      --i;
    }
  }
  return points;
}
