package main

import (
	"github.com/unixpickle/gogui"
	"os"
)

var currentPointSet = 0
var smootherIdx = 0
var canvas gogui.Canvas

type Point struct {
	X float64
	Y float64
}

type Smoother interface {
	Smooth(points []Point) []Point
}

func createWindow() {
	// Create the window.
	w, _ := gogui.NewWindow(gogui.Rect{0, 0, 400, 400})
	w.SetTitle("Prototyper")
	w.Center()
	w.Show()
	w.SetCloseHandler(func() {
		os.Exit(1)
	})
	w.SetKeyPressHandler(func(k gogui.KeyEvent) {
		if k.CharCode == 39 {
			currentPointSet = (currentPointSet + 1) % len(pointSets)
		} else if k.CharCode == 37 {
			currentPointSet = (currentPointSet + len(pointSets) - 1) %
				len(pointSets)
		} else if k.CharCode == 0x20 {
			smootherIdx = (smootherIdx + 1) % len(smoothers)
		} else {
			return
		}
		canvas.NeedsUpdate()
	})
	
	// Create the canvas.
	canvas, _ = gogui.NewCanvas(gogui.Rect{0, 0, 400, 400})
	canvas.SetDrawHandler(drawHandler)
	w.Add(canvas)
}

func currentCase() []float64 {
	return pointSets[currentPointSet]
}

func currentDataCoords() []Point {
	c := currentCase()
	spacing := canvas.Frame().Width / float64(len(c)+1)
	ySpacing := canvas.Frame().Height / 8
	yStart := canvas.Frame().Height / 2
	
	res := make([]Point, len(c))
	for i, y := range c {
		res[i] = Point{spacing * float64(i+1), y*ySpacing + yStart}
	}
	return res
}

func currentSmoother() Smoother {
	return smoothers[smootherIdx]
}

func drawHandler(ctx gogui.DrawContext) {
	points := currentDataCoords()
	
	ctx.SetFill(gogui.Color{0.5625, 0.5625, 0.5625, 1})
	ctx.FillText("Use arrow keys and space bar", 10, 10)
	
	smooth := currentSmoother().Smooth(points)
	ctx.SetStroke(gogui.Color{0, 0, 1, 1})
	ctx.SetThickness(5)
	ctx.BeginPath()
	for i, p := range smooth {
		if i == 0 {
			ctx.MoveTo(p.X, p.Y)
		} else {
			ctx.LineTo(p.X, p.Y)
		}
	}
	ctx.StrokePath()
	
	ctx.SetFill(gogui.Color{1, 0, 0, 1})
	for _, p := range points {
		ctx.FillEllipse(gogui.Rect{p.X - 10, p.Y - 10, 20, 20})
	}
}

func main() {
	go gogui.RunOnMain(createWindow)
	gogui.Main(&gogui.AppInfo{Name: "Prototyper"})
}

var pointSets [][]float64 = [][]float64{
	[]float64{0, -1, -2, -3},
	[]float64{0, -1, -2, -2},
	[]float64{0, -1, -2, -1},
	[]float64{0, -1, -1, -2},
	[]float64{0, -1, -1, -1},
	[]float64{0, -1, -1, 0},
	[]float64{0, -1, 0, -1},
	[]float64{0, -1, 0, 0},
	[]float64{0, -1, 0, 1},
	[]float64{0, 0, -1, -2},
	[]float64{0, 0, -1, -1},
	[]float64{0, 0, -1, 0},
	[]float64{0, 0, 0, -1},
	[]float64{0, 0, 0, 0},
	[]float64{0, 0, 0, 1},
	[]float64{0, 0, 1, 0},
	[]float64{0, 0, 1, 1},
	[]float64{0, 0, 1, 2},
	[]float64{0, 1, 0, -1},
	[]float64{0, 1, 0, 0},
	[]float64{0, 1, 0, 1},
	[]float64{0, 1, 1, 0},
	[]float64{0, 1, 1, 1},
	[]float64{0, 1, 1, 2},
	[]float64{0, 1, 2, 1},
	[]float64{0, 1, 2, 2},
	[]float64{0, 1, 2, 3},
}

var smoothers = []Smoother{
	LinearSmoother{},
	CarSmoother{},
}
