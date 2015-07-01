package main

import "math"

type MonotoneSplineSmoother struct{}

// Smooth uses a monotonic cubic spline.
// Thanks, http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
func (_ MonotoneSplineSmoother) Smooth(p []Point) []Point {
	// Get secants and tangents.
	dxList := make([]float64, len(p)-1)
	dyList := make([]float64, len(p)-1)
	slopes := make([]float64, len(p)-1)
	for i := 0; i < len(p)-1; i++ {
		dxList[i] = p[i+1].X - p[i].X
		dyList[i] = p[i+1].Y - p[i].Y
		slopes[i] = dyList[i] / dxList[i]
	}

	// Get degree-1 coefficients.
	deg1 := make([]float64, len(p))
	deg1[0] = slopes[0]
	for i := 0; i < len(slopes)-1; i++ {
		slope := slopes[i]
		nextSlope := slopes[i+1]

		if slope*nextSlope <= 0 {
			// To keep monotonicity, this needs to be flat.
			deg1[i+1] = 0
			continue
		}

		dx := dxList[i]
		dxNext := dxList[i+1]
		common := dx + dxNext
		deg1[i+1] = 3 * common / ((common+dxNext)/slope + (common+dx)/nextSlope)
	}
	deg1[len(deg1)-1] = slopes[len(slopes)-1]

	// Get degree-2 and degree-3 coefficients.
	deg2 := make([]float64, len(deg1)-1)
	deg3 := make([]float64, len(deg1)-1)
	for i := 0; i < len(deg1)-1; i++ {
		c1 := deg1[i]
		slope := slopes[i]
		invDx := 1 / dxList[i]
		common := c1 + deg1[i+1] - 2*slope
		deg2[i] = (slope - c1 - common) * invDx
		deg3[i] = common * math.Pow(invDx, 2)
	}

	// Generate points for the result
	startX := p[0].X
	endX := p[len(p)-1].X
	res := make([]Point, 0)
	current := 0
	for x := startX; x < endX; x++ {
		if current < len(p)-1 && x >= p[current+1].X {
			current++
		}
		x1 := x - p[current].X
		x2 := math.Pow(x1, 2)
		x3 := math.Pow(x1, 3)
		y := p[current].Y + deg1[current]*x1 + deg2[current]*x2 +
			deg3[current]*x3
		res = append(res, Point{x, y})
	}
	return res
}
