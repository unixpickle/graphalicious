# Abstract

Recall from the [DataSource](DATA_SOURCE.md) documentation that a chunk is a range of solves taken from the data source.

A *ChunkView* draws the contents of a chunk into a canvas. The visual representation of the chunk is determined by the kind of *ChunkView* being used. The *ChunkView* is alse responsible for performing animations when a chunk is mutated.

# Overview & Terminology

A *ChunkView* has an **inherent width** but no inherent height. A *ChunkView* can be drawn at any height. The *ChunkView*'s inherent width acts as a lower bound for its actual width; a *ChunkView* will never be asked to squeeze itself to a width less than its inherent width.

A *ChunkView* whose chunk contains every data point in the data set is called a **complete ChunkView**. Naturally, any *ChunkView* can be thought of as part of a wider (or equally wide) complete *ChunkView*. A *ChunkView*'s distance from the leftmost and rightmost sides of its containing complete *ChunkView* are called its **left offset** and **right offset**, respectively. It follows that the formula *left offset + right offset + inherent width* gives the inherent width of any *ChunkView*'s complete *ChunkView*. It also follows that the left offset and right offset of any complete *ChunkView* are both 0.

A *ChunkView* can be **stretched** to a width greater than its inherent width. When this happens, the *ChunkView* is given a rectangle within a canvas called the **stretch viewport**. While being stretched, a *ChunkView* should draw itself as if its complete *ChunkView* were being stretched to fill the stretch viewport. If the stretched *ChunkView* is not complete, it probably won't utilize the entire stretch viewport but intsead only to a portion of it. This portion is known as the **utilized stretch viewport**, the horizontal range of pixels in which the stretched *ChunkView* draws itself.

Animations are an important part of a *ChunkView*'s job. Any change to a *ChunkView*'s underlying chunk may trigger an animation. During an animation, a *ChunkView* repeatedly emits that its state has changed. For example, suppose a new data point is added to the *ChunkView*'s underlying chunk and the corresponding animation involves gradually widening the *ChunkView*. In this case, the *ChunkView* would change its inherent width in increments and emit these changes accordingly.

At any given time, a *ChunkView* may have a greater inherent width than its containing *ContentView*'s viewport width. This leads to the idea of a **subregion**, a horizontal region within a *ChunkView*. A subregion has two components: a width and a left offset. The left offset is the distance in pixels between the beginning of the subregion and the beginning of the *ChunkView*. The width of a subregion is how many pixels it takes up, starting from its left offset.

Since a *ChunkView* knows where individual data points will be drawn, it is responsible for reporting which points will appear in a given subregion. It must also be able to report the left offset at which the x-axis label for each data point should be placed. Since a *ChunkView*'s visual state might be changing during an animation, it must be able to report these pieces of information both during and after an animation. In other words, a *ChunkView* must be able to look into the future and predict what it will look like post-animation. This makes it possible for the containing *ContentView* to animate various things on its own (such as the x- and y-axis labels).

The *ChunkView* can receive "pointer" events (normally equivalent to mouse events), allowing user interaction. These events can be used for hover effects and click handlers. Since the height of a *ChunkView* is determined externally, it must be specified as an argument to the event handlers. In addition, since a *ChunkView* can be stretched horizontally, the stretched width may be specified as well.

A *ChunkView* should only change its *inherent width* when the underlying chunk changes. Otherwise, there should never be a reason for a *ChunkView*'s width to change.

# The PointerPosition type

The *PointerPosition* type expresses the coordinates of a pointer (e.g. the mouse) in a *ChunkView*'s coordinate system. A *PointerPosition* object has the following fields:

 * *number* x - the x-axis coordinate, relative to the leftmost part of the *ChunkView*. If the *ChunkView* is not being stretched, this is between 0 and the *ChunkView*'s inherent width. If the *ChunkView* is being stretched, this is between 0 and the *ChunkView*'s stretched width.
 * *number* y - the y-axis coordinate, relative to the top of the *ChunkView*. This is between 0 and the current height of the *ChunkView*.
 * *number* width - the width to which the *ChunkView* is being stretched. If the *ChunkView* is not being stretched, this is the *ChunkView*'s inherent width.
 * *number* height - the current height of the *ChunkView*.

# The UtilizedStretchViewport type

The *UtilizedStretchViewport* type represents a horizontal range of pixels in a 2D drawing context. It has the following fields:

 * *number* left - the x-axis coordinate of the leftmost part of the range, in pixels.
 * *number* width - the width of the range, in pixels.

# Methods

A set of methods can be used to get the current properties of a *ChunkView*. These will be updated as an animation runs:

 * *int* getInherentWidth() - get the current inherent width of the *ChunkView*.
 * *int* getLeftOffset() - get the left offset of the *ChunkView*.
 * *int* getRightOffset() - get the right offset of the *ChunkView*.
 * *int* firstVisibleDataPoint(leftOffset) - get the first visible data point (as a chunk-relative index) within a subregion which starts at the given left offset. The leftOffset will not be bounded; the ChunkView is responsible for clipping it. The return value should be between 0 and pointCount-1 inclusive.
 * *int* lastVisibleDataPoint(endLeftOffset) - get the last visible data point (as a chunk-relative index) within a subregion which ends at the given left offset. The endLeftOffset will not be bounded; the ChunkView is responsible for clipping it. The return value should be between 0 and pointCount-1 inclusive.
 * *int* xAxisLabelPosition(pointIndex) - given a chunk-relative index, get the left offset (relative to the left of the *ChunkView*) for an x-axis label.

A parallel set of methods exists for predicting properties of the *ChunkView* once it has completed its current animation. If no animation is running, these should behave like their live-animation counterparts:

 * *int* getPostAnimationInherentWidth()
 * *int* getPostAnimationLeftOffset()
 * *int* getPostAnimationRightOffset()
 * *int* postAnimationFirstVisibleDataPoint(leftOffset)
 * *int* postAnimationLastVisibleDataPoint(endLeftOffset)
 * *int* postAnimationXAxisLabelPosition(pointIndex)

The animation behavior of a *ChunkView* can be controlled:

 * *void* setAnimate(flag) - enable or disable animations.
 * *void* finishAnimation() - finish the current animation early.

You must manually notify a *ChunkView* when its chunk changes using several methods. Some of these methods return a boolean value. If this boolean value is *true*, it means that the *ChunkView* has begun animating. These methods are as follows:

 * *void* deletionBefore(oldIndex) - a data point was deleted which was before any of the data points in the *ChunkView*'s chunk.
 * *void* deletionAfter(oldIndex) - a data point was deleted which was after any of the data points in the *ChunkView*'s chunk.
 * *bool* deletionInside(oldIndex) - a data point was deleted which was inside the *ChunkView*'s chunk.
 * *void* insertionBefore() - a data point was added before the *ChunkView*'s chunk.
 * *bool* insertionInside(index) - a data point was added inside the *ChunkView*'s chunk.
 * *void* insertionAfter() - a data point was added after the *ChunkView*'s chunk.
 * *bool* modifyInside(index) - a data point inisde the *ChunkView*'s chunk was modified.

You must manually notify a *ChunkView* of any pertinent pointer events. These events take [PointerPosition](#the-pointerposition-type) arguments:

 * *void* pointerMove(pos)
 * *void* pointerDown(pos)
 * *void* pointerUp(pos)
 * *void* pointerLeave()

Drawing can be performed with these methods:

 * *void* draw(regionLeft, regionWidth, x, y, height, maxValue, ctx) - draw a subregion of the *ChunkView* within the given context at the x and y values, stretched to a certain height. The maxValue argument is used to scale the content within the sub-region to the height. In essence, every point should "fit" in the given height if its value is under maxValue.
 * [UtilizedStretchViewport](#the-utilizedstretchviewport-type) drawStretched(x, y, width, height, maxValue, ctx) - draw the entire *ChunkView* to be stretched so that it's complete *ChunkView* would fill a given stretch viewport. This returns the utilized stretch viewport information.

# Events

A *ChunkView* may emit the following events:

 * animationFrame(progress) - request a redraw because an animation is running. This includes a progress parameter which is a number between 0 (just started) and 1 (ending) which indicates how "done" the animation is.
 * animationEnd() - an animation has ended.
