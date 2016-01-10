# Abstract

An **x marker** associates a data point index with an x value in canvas coordinates. When a [ChunkView](ChunkView.md) is drawn, it generates an **XMarkers** object, which knows about the x markers for every point in the complete landscape.

A *ContentView* can use the *XMarkers* object to draw x-axis labels.

# Overview & Terminology

When a *ChunkView* draws itself, it does so into a canvas. The *ChunkView* is responsible for knowing "where" each data point is rendered&mdash;or would be rendered off-screen&mdash;relative to the canvas. Although the *ChunkView* may draw an elaborate graphic for each data point, it should be able to determine an x value that represents *approximately* where each data point lies in the canvas. The *ChunkView* must wrap this information in an *XMarkers* object, which is immutable and will not change or stop working even after successive draws of the *ChunkView*.

An *XMarkers* object is effectively an array of x markers. This array has a length, just like any other array. It also has a specific ordering: lower indices correspond to x markers further to the left. The *XMarkers* object generally represents the entire data source, including data points which are not in the source *ChunkView*'s chunk. It should be noted, however, that the number of x markers may differ from the number of data points in the data source. For example, there may be a lingering x marker for a data point which is being animated away.

Before further discussion, one definition is necessary. A **canvas region** is a horizontal range of pixels in the canvas. It has a **width**, in pixels, and an **offset**, an x value in the canvas. The region starts at the offset and goes all the way up to offset+width. A canvas region can have a negative offset and a width which extends past the edge of the canvas.

An *XMarkers* object can perform two types of computations. First, it can report which x markers lie within a given canvas region. This allows a *ContentView* to figure out which x markers it would like to render. Second, the *XMarkers* can report specific information about each x marker.

The *XMarkers* object can give a lot of information about each x marker. Recall that the *XMarkers* object can represent the state of a morphing landscape. As a result, some data points may be deleting, inserting, or changing. For each x marker, there is an associated **old index** and **index**. For a point which was inserted, the old index will be -1 (invalid). For a point which is being deleted, the index will be -1 (invalid). For points with higher indices than an insertion/deletion, the old index and index will differ by 1. Data points which are undergoing some kind of animation also have an **old data point**, a **data point**, and an **animation progress** field. The latter indicates how morphed the data point is between the old data point and the new data point. For data points which are being modified, the old data point and the data point will be different and non-null. For inserting or deleting points, one of these two fields will be null.

# The XMarker type

The *XMarker* type stores various information about an x marker. It has the following fields:

 * *number* x - the x offset, in canvas-relative coordinates, for the marker. The meaning of this will vary by visual style. For example, one visual style might use the middle of a bar, while another may use the space before some kind of dot, etc.
 * *int* index - the index of the corresponding data point in the *DataSource*. This is -1 if the data point was deleted from the data source and is being animated away.
 * *int* oldIndex - the index of the data point in the *DataSource* before the current animating change. This is -1 if the point was just inserted and is being animated in.
 * [DataPoint](../DataSource.md#the-datapoint-type) dataPoint - the current (post-animation) data point for this marker. This will be null if the point is being deleted, or if the point is not undergoing an animation.
 * [DataPoint](../DataSource.md#the-datapoint-type) oldDataPoint - the old (pre-animation) data point for this marker. This will be null if the point is being inserted, or if the point is not undergoing an animation.
 * *number* animationProgress - a fraction from 0 (animation is just starting) to 1 (animation completed) representing the transition between the old data point to the new data point. This is -1 for data points which are not being animated.

# The CanvasRegion type

The *CanvasRegion* type represents a canvas region. It has the following fields:

 * *number* left - the left offset of the region, in canvas-relative coordinates.
 * *number* width - the width of the region, in pixels.

# Methods

The *XMarkers* object implements the following methods:

 * *int* getLength() - get the total number of x markers.
 * [Range](VisualStyle.md#the-range-type) computeRange(region) - compute the range of x markers that are inside a given [CanvasRegion](#the-canvasregion-type). This guarantees that no x markers (besides the ones within the returned range) will lie within the given region.
 * [XMarker](#the-xmarker-type) getXMarker(index) - get the x marker at the given index.
