package main

type LinearSmoother struct{}

func (_ LinearSmoother) Smooth(points []Point) []Point {
	return points
}
