# Abstract

Recall from the [DataSource](DATA_SOURCE.md) documentation that a chunk is a range of solves taken from the data source.

A *ChunkView* draws the contents of a chunk into a canvas. The visual representation of the chunk is determined by the kind of *ChunkView* being used. The *ChunkView* is alse responsible for performing animations when a chunk is mutated.

# Overview & Terminology

A *ChunkView* has an **inherent width** but no inherent height. A *ChunkView* can be drawn at any height. It is possible for a *ChunkView* to be horizontally **stretched**, in which case it is drawn at a width greater than its inherent width.

A *ChunkView* whose chunk contains every data point in the data set is called a **complete ChunkView**. Naturally, any *ChunkView* can be thought of as part of a wider (or equally wide) complete *ChunkView*. A *ChunkView*'s hypothetical distance from the leftmost and rightmost sides of its containing complete *ChunkView* are called its **left offset** and **right offset**, respectively. It follows that the formula *left offset + right offset + inherent width* gives the inherent width of any *ChunkView*'s complete *ChunkView*. It also follows that the left offset and right offset of any complete *ChunkView* are both 0.

Animations are an important part of a *ChunkView*'s job. At any time, a chunk view can emit an event indicating that its visual properties have been altered. For example, suppose a new data point is added to the *ChunkView*'s underlying chunk and the corresponding animation involves gradually widening the *ChunkView*. In this case, the *ChunkView* would change its inherent width in increments and emit these changes accordingly.

At any given time, a *ChunkView* may have a greater inherent width than its containing *ContentView*'s viewport width. This leads to the idea of a **subregion**, a horizontal region within a *ChunkView*. A subregion has two components: a width and a left offset. The left offset is the distance in pixels between the beginning of the subregion and the beginning of the *ChunkView*. The width of a subregion is how many pixels it takes up, starting from its left offset.

Since a *ChunkView* knows where individual data points will be drawn, it is responsible for reporting which points will appear in a given subregion. In addition, a *ChunkView* must be able to report which data points will be in a subregion after its current animation is complete. This makes it possible for the containing *ContentView* to animate various things on its own (such as y-axis labels).

# Methods

A set of methods can be used to get the current properties of a *ChunkView*. These will be updated as an animation runs:

 * *int* getInherentWidth() - get the current inherent width of the *ChunkView*.
 * *int* getLeftOffset() - get the left offset of the *ChunkView*.
 * *int* getRightOffset() - get the right offset of the *ChunkView*.
 * *int* firstVisibleDataPoint(leftOffset) - get the first visible data point (as a chunk-relative index) within a subregion which starts at the given left offset.
 * *int* lastVisibleDataPoint(endLeftOffset) - get the last visible data point (as a chunk-relative index) within a subregion which ends at the given left offset.

A parallel set of methods exists for predicting properties of the *ChunkView* once it has completed its current animation:

 * *int* getPostAnimationInherentWidth()
 * *int* getPostAnimationLeftOffset()
 * *int* getPostAnimationRightOffset()
 * *int* postAnimationFirstVisibleDataPoint(leftOffset)
 * *int* postAnimationLastVisibleDataPoint(endLeftOffset)

You must manually notify a *ChunkView* when its chunk changes. This is done through the following methods:

 * *void* deletionBefore(oldIndex) - a data point was deleted which was before any of the data points in the *ChunkView*'s chunk.
 * *void* deletionAfter(oldIndex) - a data point was deleted which was after any of the data points in the *ChunkView*'s chunk.
 * *void* deletionInside(oldIndex) - a data point was deleted which was inside the *ChunkView*'s chunk.
 * *void* addAfter() - a data point was added after the *ChunkView*'s chunk.
 * *void* addInside() - a data point was added to the end of the *ChunkView*'s chunk.
 * *void* modifyInside(index) - a data point inisde the *ChunkView*'s chunk was modified.

Drawing and animations can be controlled with these methods:

 * *void* draw(regionLeft, regionWidth, x, y, height, ctx) - draw a subregion of the *ContentView* within the given context at the x and y values, stretched to a certain height.
 * *void* drawStretched(x, y, width, height, ctx) - draw the entire *ContentView*, stretched to a given width and height, at the given coordinates inside the given context.
 * *void* setAnimate(flag) - enable or disable animations.

# Events

A *ChunkView* may emit the following events:

 * redraw() - request a redraw for any reason other than an animation frame.
 * animationStart() - an animation has begun.
 * redrawAnimation(progress) - request a redraw because an animation is running. This includes a progress parameter which is a number between 0 (just started) and 1 (ending) which indicates how "done" the animation is.
 * animationEnd() - an animation has ended. Every animationStart must be matched with an animationEnd.
