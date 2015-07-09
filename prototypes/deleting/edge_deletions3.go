package main

import (
	"math"
	"math/rand"
	"os"
	"time"

	"github.com/unixpickle/gogui"
)

var canvas gogui.Canvas
var timeStart float64

type Point struct {
	X float64
	Y float64
}

var startPoints []Point = []Point{
	{-250, 54},
	{-150, 130},
	{-50, 300},
	{50, 250},
	{150, 270},
	{250, 150},
	{350, 200},
}

const duration = 0.5

var animating bool = false

func main() {
	go gogui.RunOnMain(createWindow)
	gogui.Main(&gogui.AppInfo{Name: "Option 3"})
}

func createWindow() {
	timeStart = CurrentTime()

	// Create the window.
	w, _ := gogui.NewWindow(gogui.Rect{0, 0, 400, 400})
	w.SetTitle("Option 3")
	w.Center()
	w.Show()
	w.SetCloseHandler(func() {
		os.Exit(1)
	})
	w.SetKeyDownHandler(func(k gogui.KeyEvent) {
		if animating {
			startPoints = startPoints[:len(startPoints)-1]
			for i, p := range startPoints {
				p.X += 100
				startPoints[i] = p
			}
			point := Point{-250, float64(rand.Intn(300) + 50)}
			startPoints = append([]Point{point}, startPoints...)
		}
		switch k.CharCode {
		case 0x20:
			animating = false
		}
	})
	w.SetKeyUpHandler(func(k gogui.KeyEvent) {
		switch k.CharCode {
		case 0x20:
			animating = true
			timeStart = CurrentTime()
		}
	})

	// Create the canvas.
	canvas, _ = gogui.NewCanvas(gogui.Rect{0, 0, 400, 400})
	canvas.SetDrawHandler(drawHandler)
	w.Add(canvas)

	go func() {
		for {
			time.Sleep(time.Second / 24)
			gogui.RunOnMain(func() {
				canvas.NeedsUpdate()
			})
		}
	}()
}

func drawHandler(ctx gogui.DrawContext) {
	percent := (CurrentTime() - timeStart) / duration
	if !animating {
		percent = 0
	}
	if percent > 1 {
		percent = 1
	}
	pointsWithDeleting := []Point{}
	pointsWithoutDeleting := []Point{}
	for i := 0; i < len(startPoints)-1; i++ {
		origPoint := startPoints[i]
		p := Point{origPoint.X + 100*percent, origPoint.Y}
		pointsWithoutDeleting = append(pointsWithoutDeleting, p)
		pointsWithDeleting = append(pointsWithDeleting, p)
	}
	if percent < 1 {
		endPoint := startPoints[len(startPoints)-1]
		pointsWithoutDeleting = append(pointsWithoutDeleting, endPoint)
	}

	initial := Spline(pointsWithoutDeleting)
	final := Spline(pointsWithDeleting)
	ctx.SetStroke(gogui.Color{0, 0, 1, 1})
	ctx.SetThickness(5)
	ctx.BeginPath()
	for i, pf := range final {
		pi := initial[i]
		p := Point{pf.X, pi.Y + (pf.Y-pi.Y)*percent}
		if i == 0 {
			ctx.MoveTo(p.X, p.Y)
		} else {
			ctx.LineTo(p.X, p.Y)
		}
	}
	ctx.StrokePath()
	ctx.SetStroke(gogui.Color{0, 0, 1, 1 - percent})
	for i := len(final); i < len(initial); i++ {
		p := initial[i]
		if i == len(final) {
			ctx.MoveTo(p.X, p.Y)
		} else {
			ctx.LineTo(p.X, p.Y)
		}
	}
	if percent < 1 {
		endPoint := startPoints[len(startPoints)-1]
		ctx.LineTo(endPoint.X, endPoint.Y)
	}
	ctx.StrokePath()
	ctx.SetFill(gogui.Color{1, 0, 0, 1})
	for _, p := range pointsWithDeleting {
		ctx.FillEllipse(gogui.Rect{p.X - 5, p.Y - 5, 10, 10})
	}
	if percent < 1 {
		endPoint := startPoints[len(startPoints)-1]
		ctx.SetFill(gogui.Color{1, 0, 0, 1 - percent})
		ctx.FillEllipse(gogui.Rect{endPoint.X - 5, endPoint.Y - 5, 10, 10})
	}
}

// Spline generates a monotonic cubic spline for a bunch of x-sorted points.
// Thanks, http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
func Spline(p []Point) []Point {
	if len(p) <= 1 {
		return []Point{}
	}

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

func CurrentTime() float64 {
	return float64(time.Now().UnixNano()) / float64(time.Second)
}
