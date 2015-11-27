function rangeIntersection(range1, range2) {
  if (range1.startIndex > range2.startIndex) {
    return rangeIntersection(range2, range1);
  }

  var length = Math.min(range2.length, range1.startIndex+range1.length-range2.startIndex);
  if (length <= 0) {
    return {startIndex: 0, length: 0};
  }

  return {
    startIndex: range2.startIndex,
    length: length
  };
}

function regionIntersection(region1, region2) {
  if (region1.left > region2.left) {
    return regionIntersection(region2, region1);
  }

  var width = Math.min(region2.width, region1.left+region1.width-region2.left);
  if (width <= 0) {
    return {left: 0, width: 0};
  }

  return {
    left: region2.left,
    width: width
  };
}

exports.rangeIntersection = rangeIntersection;
exports.regionIntersection = regionIntersection;
