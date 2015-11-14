# Abstract

It is suggested that you read the [DataSource](../DataSource.md) and [VisualStyle](VisualStyle.md) documentation before reading this.

A *ChunkView* draws a chunk into a canvas using a visual style. It also handles animations, mouse events, and more.

# Overview & Terminology

Recall that a partial landscape has an offset and a width. Since a *ChunkView* draws a partial landscape, it is handy to be able to refer to the width and offset of said landscape. Thus, we say that the **width** and **offset** of a *ChunkView* are the width and offset of its partial landscape, respectively. Notice that we have no similar term for height. In fact, a *ChunkView* may be asked to draw its partial landscape at any height.

Since a partial landscape is a part of a complete landscape, it is helpful for a *ChunkView* to be able to report information about its complete landscape. The width of the complete landscape is called the **encompassing width** of a *ChunkView*. If you add the offset and width of a *ChunkView*, the sum can never be greater than the encompassing width.

Animations are essential to beautiful graphs, and a *ChunkView* is responsible for them. An **animation** is a smooth transition between an old complete landscape and a new complete landscape. Only some changes to the complete landscape (i.e. changes to the *DataSource*) may trigger an animation, while others (i.e. changes in visual style) may not. When a *ChunkView* is performing an animation, we can imagine the complete landscape **morphing** from the old landscape to the new one. The *VisualStyle* interface does not capture said morphing, but instead only represents **final landscapes**. A final landscape is a landscape during which no animations are taking place. While a *VisualStyle* only knows about **final landscapes**, the *ChunkView* has extra information about **morphing landscapes** as well. In particular, while an animation is being performed, a *ChunkView* has two different offsets, widths, and encompassing widths. One set of values is for the final landscape, while the other is for the current morphing landscape. This is useful information because it allows the *ContentView* to know how and where to draw the *ChunkView* at every point during an animation.

Since a *ChunkView* knows about morphing landscapes, it is the only entity that knows where partial landscapes will be at any given time during an animation. Thus, it provides mid-animation analogs for many of the *ViewProvider* methods.

When a *ChunkView* is drawn into an HTML5 canvas, it is given a **canvas viewport**, a canvas and a rectangle of pixels in which the *ChunkView* may draw itself. If the width of the complete landscape is greater than the width of the canvas viewport, then the *ChunkView* will be given a **scroll offset**. In this case, the x value in the canvas at which the partial landscape will be rendered is equal to the sum of the x value of canvas viewport, the offset of the partial landscape, and the negative scroll offset.

Sometimes, the complete landscape will not be as wide as the canvas viewport. In this case, the complete landscape literally does not "fill up" the place where it is being rendered. The visual style of a *ChunkView* determines how it handles this situation. Sometimes, a *ChunkView* may visually stretch itself; other times, a *ChunkView* may choose to justify itself to the left or right of the canvas viewport.

After a *ChunkView* is done drawing itself, it returns a **utilization report**&mdash;a pair `(x, width)` specifying the horizontal range of pixels within the canvas viewport that the partial landscape took up. This is particularly useful for cases when the complete landscape is narrower than the canvas viewport, since it tells the *ContentView* how much screen realestate was actually taken up.

The *ChunkView* can receive "pointer" events (normally equivalent to mouse events), allowing user interaction. These events can be used for hover effects and click handlers. Since the height of a *ChunkView* is determined externally, it must be specified as an argument to the event handlers. In addition, since a *ChunkView* can be stretched horizontally, the stretched width may be specified as well.

# The PointerPosition type

The *PointerPosition* type expresses the coordinates of a pointer (e.g. the mouse) in a *ChunkView*'s coordinate system. A *PointerPosition* object has the following fields:

 * *number* x - the x-axis coordinate, relative to the leftmost part of the *ChunkView*. If the *ChunkView* is not being stretched, this is between 0 and the *ChunkView*'s inherent width. If the *ChunkView* is being stretched, this is between 0 and the *ChunkView*'s stretched width.
 * *number* y - the y-axis coordinate, relative to the top of the *ChunkView*. This is between 0 and the current height of the *ChunkView*.
 * *number* width - the width to which the *ChunkView* is being stretched. If the *ChunkView* is not being stretched, this is the *ChunkView*'s inherent width.
 * *number* height - the current height of the *ChunkView*.

# The UtilizationReport type

The *UtilizationReport* type represents a horizontal range of pixels in a 2D drawing context. It has the following fields:

 * *number* left - the x-axis coordinate of the leftmost part of the range, in pixels.
 * *number* width - the width of the range, in pixels.

# The CanvasViewport type

The *CanvasViewport* type represents a rectangular region inside a canvas. It has the following fields:

 * *number* x - the x offset of the top left corner of the region.
 * *number* y - the y offset of the top left corner of the region.
 * *number* width - the width of the region.
 * *number* height - the height of the region.
 * *Context2D* context - the 2D drawing context.

# Methods

A set of methods can be used to get the current properties of the morphing partial and complete landscape:

 * *int* getWidth() - get the width of the region of the morphing partial scene of the *ChunkView*.
 * *int* getOffset() - get the offset of the region of the morphing partial scene of the *ChunkView*.
 * *int* getEncompassingWidth() - get the width of the morphing complete scene.
 * [Range](VisualStyle.md#the-range-type) computeRange(region, pointCount) - does what it does on a *VisualStyle*, but for the morphing complete landscape.
 * [Region](#the-region-type) computeRegion(range, pointCount) - does what it does on a *VisualStyle*, but for the morphing complete landscape.
 * *number* xLabelPosition(pointIndex, pointCount) - does what it does on a *VisualStyle*, but for the morphing complete landscape.

The animation behavior of a *ChunkView* can be controlled:

 * *void* finishAnimation() - finish the current animation early.

A *ContentView* should notify a *ChunkView* when the *DataSource* changes. These methods return a boolean value, indicating whether or not an animation has been initiated by the change. These methods also take a boolean *animate* value, suggesting whether or not this change should trigger an animation. The *animate* argument is necessary but not sufficient for an animation to take place.

 * *bool* deletion(oldIndex, animate) - a data point was deleted from the *DataSource*.
 * *void* insertion(index) - a data point was inserted into the *DataSource* at the given index.
 * *bool* modification(index) - a data point in the *DataSource* was modified.

A *ContentView* should notify a *ChunkView* of any pointer events. These events take [PointerPosition](#the-pointerposition-type) arguments:

 * *void* pointerMove(pos)
 * *void* pointerDown(pos)
 * *void* pointerUp(pos)
 * *void* pointerLeave()

Drawing can be performed with these methods:

 * [UtilizationReport](#the-utilizationreport-type) draw(viewport, scrollX, maxValue) - draw the *ChunkView* in the given viewport at the given offset. The maxValue argument helps determine how vertically stretched the content should be; it specifies the primary value that should correspond to data points which take up the full height of the canvas viewport.

# Events

A *ChunkView* may emit the following events:

 * animationFrame(progress) - request a redraw because an animation is running. This includes a progress parameter which is a number between 0 (just started) and 1 (ending) which indicates how "done" the animation is. After a progress of 1 is reported, the *ChunkView* will emit *animationEnd*.
 * animationEnd() - an animation has ended.

