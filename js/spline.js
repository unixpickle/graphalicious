// Splines are useful for generating smooth lines which pass through points on a
// graph.
// 
// I used the code on Wikipedia as a reference point:
// http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
(function() {
  
  // This returns a function which takes an argument x and returns the value of
  // "c0 + c1*(x-translate) + c2*(x-translate)^2 + c3*(x-translate)^3".
  function cubic(translate, c0, c1, c2, c3) {
    return function(theX) {
      var x = theX - translate;
      var x2 = x * x;
      var x3 = x2 * x;
      return c0 + c1*x + c2*x2 + c3*x3;
    };
  }
  
  // This uses monotone cubic interpolation to generate cubic functions to go
  // between every point in a dataset.
  // The xData argument must be sorted in ascending order. Each element in the
  // xData array corresponds to an element in the yData array.
  function splines(xData, yData) {
    if (xData.length != yData.length) {
      throw new Error('Length of x and y data must match.');
    }
    
    var len = xData.length;
    
    // Get secants and tangents.
    var dxList = [];
    var dyList = [];
    var slopes = [];
    for (var i = 0; i < len-1; ++i) {
      dxList[i] = xData[i+1] - xData[i];
      dyList[i] = yData[i+1] - yData[i];
      slopes[i] = dyList[i] / dxList[i];
    }
    
    // Get coefficients for the "x" term.
    var deg1 = [slopes[0]];
    for (var i = 0; i < len-2; ++i) {
      var slope = slopes[i];
      var nextSlope = slopes[i+1];
      
      if (slope*nextSlope <= 0) {
        // To keep monotonicity, this needs to be flat.
        deg1[i+1] = 0;
        continue;
      }
      
      var dx = dxList[i];
      var nextDx = dxList[i+1];
      var common = dx + dxNext;
      deg1[i+1] = 3 * common / ((common+nextDx)/slope + (common+dx)/nextSlope);
    }
    // Add the last slope as a first degree coefficient so the other
    // coefficients can use it for their last element.
    deg1.push(slopes[slopes.length-1]);
    
    // Generate the rest of the coefficients.
    var deg2 = [];
    var deg3 = [];
    for (var i = 0; i < len-1; ++i) {
      var c1 = deg1[i];
      var slope = slopes[i];
      var invDx = 1 / dxList[i];
      var common = c1 + deg1[i+1] - 2*slope;
      deg2[i] = (slope - c1 - common) * invDx;
      deg3[i] = common * Math.pow(invDx, 2);
    }
    
    // Generate the resulting cubic functions.
    var res = [];
    for (var i = 0; i < len-1; ++i) {
      var translate = xData[i];
      var constant = yData[i];
      res[i] = cubic(translate, constant, deg1[i], deg2[i], deg3[i]);
    }
    return res;
  }
  
  if (!window.graphalicious) {
    window.graphalicious = {splines: splines};
  } else {
    window.graphalicious.splines = splines;
  }
  
})();