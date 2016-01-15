# Abstract

It is suggested that you read the [DataSource](../DataSource.md) and [VisualStyle](VisualStyle.md) documentation before reading this.

A *ChunkView* draws a chunk into a canvas using a visual style. It also handles animations, mouse events, and more.

# Overview & Terminology

Recall that a partial landscape has an offset and a width. Since a *ChunkView* draws a partial landscape, it is handy to be able to refer to the width and offset of said landscape. Thus, we say that the **width** and **offset** of a *ChunkView* are the width and offset of its partial landscape, respectively. Notice that we have no similar term for height. In fact, a *ChunkView* may be asked to draw its partial landscape at any height.

Since a partial landscape is a part of a complete landscape, it is helpful for a *ChunkView* to be able to report information about its complete landscape. The width of the complete landscape is called the **encompassing width** of a *ChunkView*. If you add the offset and width of a *ChunkView*, the sum can never be greater than the encompassing width.

Animations are essential to beautiful graphs, and a *ChunkView* is responsible for them. An **animation** is a smooth transition between an old complete landscape and a new complete landscape. Only some changes to the complete landscape (i.e. changes to the *DataSource*) may trigger an animation, while others (i.e. changes in visual style) may not. When a *ChunkView* is performing an animation, we can imagine the complete landscape **morphing** from the old landscape to the new one. The *VisualStyle* interface does not capture said morphing, but instead only represents **final landscapes**. A final landscape is a landscape during which no animations are taking place. While a *VisualStyle* only knows about **final landscapes**, the *ChunkView* has extra information about **morphing landscapes** as well. In particular, while an animation is being performed, a *ChunkView* has two different offsets, widths, and encompassing widths. One set of values is for the final landscape, while the other is for the current morphing landscape. This is useful information because it allows the *ContentView* to know how and where to draw the *ChunkView* at every point during an animation.

A *ChunkView* also provides specific information about the position of data points on the x-axis. Specifically, it provides x-axis markers, canvas-relative horizontal offsets, for each point. These x-axis markers may be used by *ContentView*s to draw x-axis labels for each data point in the graph. See the [XMarkers](XMarkers.md) documentation for more.

When a *ChunkView* is drawn into an HTML5 canvas, it is given a **viewport**, a rectangle in the canvas in which the *ChunkView* may draw itself. If the width of the complete landscape is greater than the width of the viewport, then the *ChunkView* will be given a **scroll offset**. In this case, the x value in the canvas at which the partial landscape will be rendered is equal to the sum of the x value of viewport, the offset of the partial landscape, and the negative scroll offset.

Sometimes, the complete landscape will not be as wide as the viewport. In this case, the complete landscape literally does not "fill up" the place where it is being rendered. The visual style of a *ChunkView* determines how it handles this situation. Sometimes, a *ChunkView* may visually stretch itself; other times, a *ChunkView* may choose to justify itself to the left or right of the viewport.

When a *ChunkView* is being drawn, it is given a **full viewport** in addition to the viewport itself. The full viewport, which is necessarily a superset of the viewport, indicates where the *ChunkView* may draw overflowing content such as tooltips.

After a *ChunkView* is done drawing itself, it returns a **draw report**&mdash;a tuple `(x, width, xMarkers)` specifying both the [XMarkers](XMarkers.md) and the horizontal range of pixels within the viewport that the partial landscape took up. This is particularly useful for cases when the complete landscape is narrower than the viewport, since it tells the *ContentView* how much screen real estate was actually taken up. If the width of the draw report is 0, then the x value can be used to hint where the nearest off-screen edge of the *ChunkView* is. In this case only, the x value may be outside of the viewport.

The *ChunkView* can receive "pointer" events (normally equivalent to mouse events), allowing user interaction. These events can be used for hover effects and click handlers. The events themselves specify coordinates relative to the canvas. As a result, the *ChunkView* will need to request a re-draw in order to utilize the coordinates in any meaningful way.

Since *ChunkView*s only draw partial landscapes, *ContentView*s may have to create and draw new *ChunkView*s as the user demands to look at different parts of the data. As a consequence, animations get "cut off" when the user demands new parts of the data, since newly created *ChunkView*s do not know the animation state of their predecessors. However, this is not as big a problem as it may seem. All a *ContentView* needs to do is ensure that new *ChunkView*s are not created or drawn while the last *ChunkView* is animating. While this seems like a decent answer to the problem, there are other cases where this argument is unacceptable.

Sometimes, a *ChunkView* may wish to **handoff** data to the next *ChunkView*. Handoff is useful for things like fading tooltips that the *ContentView* has no direct knowledge of. For example, if the user hovers over a point to see more information about it, the tooltip should not vanish and then fade back in if the *ChunkView* is replaced. Handoff is not intended to apply to animations; *ContentView*s should not expect *ChunkView*s to handoff their animation states. Nevertheless, *ContentView*s should implement the handoff facility, telling each *ChunkView* about its predecessor when applicable.

# The PointerPosition type

The *PointerPosition* type expresses the coordinates of a pointer (e.g., the mouse or the users finger) in an HTML5 canvas's coordinate system. A *PointerPosition* object has the following fields:

 * *number* x - the x-axis coordinate, relative to the leftmost part of the canvas.
 * *number* y - the y-axis coordinate, relative to the top of the canvas.

# The DrawReport type

The *DrawReport* type represents a horizontal range of pixels in a 2D drawing context and x-axis offsets corresponding to data points in this range. It has the following fields:

 * *number* left - the x-axis coordinate of the leftmost part of the range, in pixels. If the *ChunkView* was drawn completely off-screen, this should indicate the x offset of *ChunkView*'s edge nearest to the viewport.
 * *number* width - the width of the range, in pixels.
 * \[[XMarkers](XMarkers.md)\] xMarkers - the x-axis markers at the instant the *ChunkView* was drawn. This will be frozen in time and immutable, meaning that it can be referenced and used for as long as necessary.

# The CanvasViewport type

The *CanvasViewport* contains the viewport, full viewport, and canvas. It has the following fields:

 * *number* x - the x offset of the top left corner of the region.
 * *number* y - the y offset of the top left corner of the region.
 * *number* width - the width of the region.
 * *number* height - the height of the region.
 * *number* fullX - the x offset of the top left corner of the full viewport.
 * *number* fullY - the y offset of the top left corner of the full viewport.
 * *number* fullWidth - the width of the full viewport.
 * *number* fullHeight - the width of the full viewport.
 * *Context2D* context - the 2D drawing context.

# Methods

A set of methods can be used to get the current properties of the morphing partial and complete landscape:

 * *number* getWidth() - get the width of the region of the morphing partial scene of the *ChunkView*.
 * *number* getOffset() - get the offset of the region of the morphing partial scene of the *ChunkView*.
 * *number* getEncompassingWidth() - get the width of the morphing complete scene.

Since the *ChunkView* is responsible for morphing animations, and may perform other internal animations as well, there are a number of animation-related methods:

 * *void* finishAnimation() - finish the current animation early. This only applies to animations which occur because of data changes. Some animations (e.g. tooltips fading in/out) are specific to the *ChunkView* and cannot be controlled by this method.
 * [Harmonizer](https://github.com/unixpickle/harmonizer) harmonizer() - get the *Harmonizer* that this *ChunkView* uses for its animations. When a *ChunkView* needs to be redrawn, it will request the redraw through this *Harmonizer*.

A *ContentView* should notify a *ChunkView* when the *DataSource* changes. These methods return a boolean value, indicating whether or not an animation has been initiated by the change. These methods also take a boolean *animate* value, suggesting whether or not this change should trigger an animation. The *animate* argument is necessary but not sufficient for an animation to take place.

 * *bool* deletion(oldIndex, animate) - a data point was deleted from the *DataSource*.
 * *void* insertion(index, animate) - a data point was inserted into the *DataSource* at the given index.
 * *bool* modification(index, animate) - a data point in the *DataSource* was modified.

A *ContentView* should notify a *ChunkView* of any pointer events. These events take [PointerPosition](#the-pointerposition-type) arguments:

 * *void* pointerMove(pos)
 * *void* pointerClick(pos)
 * *void* pointerLeave()

Drawing can be performed with these methods:

 * [DrawReport](#the-drawreport-type) draw(viewport, scrollX, maxValue) - draw the *ChunkView* in the given viewport at the given offset. The maxValue argument helps determine how vertically stretched the content should be; it specifies the primary value that should correspond to data points which take up the full height of the viewport. The *ChunkView* is responsible for clipping itself inside of the specified viewport.

The handoff mechanism is implemented through the following method:

 * *void* handoff(lastChunkView) - tell the *ChunkView* about the previous *ChunkView*. If a *ContentView* intends to call this, it should do so before drawing the *ChunkView* for the first time.

# Events

A *ChunkView* may emit the following events:

 * animationFrame(progress) - tell the *ContentView* the new progress of a running animation. The progress value will be between 0 (just started) and 1 (ending) which indicates how "done" the animation is. After a progress of 1 is reported, the *ChunkView* will emit *animationEnd*. This event only fires for animations involving data changes; it will not fire for internal animations such as tooltip fade-ins. The *ContentView* which receives this event should request a redraw from the root *Harmonizer*.
 * animationEnd() - an animation has ended. This corresponds to a the last animationFrame event for a given animation.
