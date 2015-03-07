package main

import "math"

type CarSmoother struct{}

func (_ CarSmoother) Smooth(p []Point) []Point {
	if len(p) <= 1 {
		return p
	}
	res := []Point{p[0], p[1]}
	vy := (p[1].Y-p[0].Y) / (p[1].X-p[0].X)
	for i := 1; i < len(p)-1; i++ {
		start := p[i]
		end := p[i + 1]
		t := end.X - start.X
		dy := end.Y - start.Y
		accel := 2 * (dy-vy*t) / math.Pow(t, 2)
		
		// Generate each point
		for x := start.X; x < end.X; x++ {
			theT := x - start.X
			y := start.Y + vy*theT + 0.5*accel*math.Pow(theT, 2)
			res = append(res, Point{x, y})
		}
		
		vy = vy + accel*t
	}
	
	return res
}
