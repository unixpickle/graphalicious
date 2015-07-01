package main

import (
	"github.com/unixpickle/gogui"
	"math/rand"
	"os"
	"time"
)

var animationStart int64
var canvas gogui.Canvas
var psIndex int
var roughPoints []Point
var smootherIndex int
var smoothPoints []Point

type Point struct {
	X float64
	Y float64
}

type Smoother interface {
	Smooth(points []Point) []Point
}

func addPsIndex(add int) {
	psIndex += add
	if psIndex < 0 {
		psIndex += len(pointSets)
	} else if psIndex >= len(pointSets) {
		psIndex = 0
	}
	runAnimation()
}

func addSmootherIndex(add int) {
	smootherIndex += add
	if smootherIndex < 0 {
		smootherIndex += len(smoothers)
	} else if smootherIndex >= len(smoothers) {
		smootherIndex = 0
	}
	runAnimation()
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
		switch (k.CharCode) {
		case 39:
			addPsIndex(1)
		case 37:
			addPsIndex(-1)
		case 0x20:
			addSmootherIndex(1)
		}
	})
	
	// Create the canvas.
	canvas, _ = gogui.NewCanvas(gogui.Rect{0, 0, 400, 400})
	canvas.SetDrawHandler(drawHandler)
	w.Add(canvas)
	
	runAnimation()
}

func dataPoints() []Point {
	c := pointSets[psIndex]
	spacing := canvas.Frame().Width / float64(len(c)+1)
	ySpacing := canvas.Frame().Height / 8
	yStart := canvas.Frame().Height / 2
	
	res := make([]Point, len(c))
	for i, y := range c {
		res[i] = Point{spacing * float64(i+1), y*ySpacing + yStart}
	}
	return res
}

func drawHandler(ctx gogui.DrawContext) {
	ctx.SetFill(gogui.Color{0.5625, 0.5625, 0.5625, 1})
	ctx.FillText("Use arrow keys and space bar", 10, 10)
	
	progress := float64(time.Now().UnixNano() - animationStart) /
		500000000
	if progress > 1 {
		progress = 1
	}
	
	ctx.SetStroke(gogui.Color{0, 0, 1, 1})
	ctx.SetThickness(5)
	ctx.BeginPath()
	count := int(float64(len(smoothPoints)) * progress)
	for i, p := range smoothPoints {
		if i > count {
			break
		}
		if i == 0 {
			ctx.MoveTo(p.X, p.Y)
		} else {
			ctx.LineTo(p.X, p.Y)
		}
	}
	ctx.StrokePath()
	
	ctx.SetFill(gogui.Color{1, 0, 0, 1})
	for _, p := range roughPoints {
		ctx.FillEllipse(gogui.Rect{p.X - 10, p.Y - 10, 20, 20})
	}
	
	if progress == 1 {
		return
	}
	go func() {
		time.Sleep(time.Second / 24)
		gogui.RunOnMain(func() {
			canvas.NeedsUpdate()
		})
	}()
}

func main() {
	// Generate a bunch of random points
	points := make([]float64, 1000)
	for i := 0; i < 1000; i++ {
		points[i] = rand.Float64()*2 - 1
	}
	pointSets = append(pointSets, points)
	
	go gogui.RunOnMain(createWindow)
	gogui.Main(&gogui.AppInfo{Name: "Prototyper"})
}

func runAnimation() {
	roughPoints = dataPoints()
	smoothPoints = smoothers[smootherIndex].Smooth(roughPoints)
	animationStart = time.Now().UnixNano()
	canvas.NeedsUpdate()
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
	[]float64{0.8355399163591861, -0.3545106960244948, -0.34485699928058755,
		-0.5390742528720136, 0.4988706672597736},
	[]float64{-0.44139209651407396, -0.2898382528479545, -0.029206416739801844,
		0.04645547822133356, 0.15440355199851807},
	[]float64{0.4149426624834125, 0.10185054853504227, -0.21995956437057473,
		-0.36364659145469946, 0.32286837136564395},
	[]float64{-0.6396850705080528, 0.865959568622517, 0.8296994402521343,
		0.7211820031410932, 0.8710369623097398},
}

var smoothers = []Smoother{
	LinearSmoother{},
	CarSmoother{},
	MonotoneSplineSmoother{},
}
