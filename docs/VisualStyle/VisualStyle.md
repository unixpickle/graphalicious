# Abstract

A **visual style** is a means of presenting uniformly spaced data points. Visual styles determine how many pixels a set of data points needs to be rendered, how changes in those data points are animated, and how those data points are drawn. For example, a visual style might be described by a sentence like "a bar graph with 50-pixel-wide blue bars, 10 pixel spacing, and 20 pixel margins."

It is the job of a [ContentView](../ContentView/ContentView.md) to present data using a visual style. In order to do that, the *ContentView* must use the visual style to generate *ChunkView*s which are then drawn into an HTML5 canvas.

# Overview & Terminology

If you were to draw all of the data points in a *DataSource* side-by-side using a visual style, you would be drawing the **complete landscape**. Notice that the complete landscape depends on context, since it depends on both the visual style and the *DataSource*. Notice also that the complete landscape is a pixel-by-pixel drawing. We can talk about horizontal offsets in a complete landscape, the width of a complete landscape, etc. In general, an **offset** in a complete landscape refers to a number of pixels from the leftmost pixel in it.

A *ChunkView*, as you will read about in other parts of the documentation, draws a **partial landscape**. A partial landscape may be a complete landscape, but it may also be a cropped version of one. For instance, a partial landscape may have an offset of 100px and a width of 500px while the complete landscape has a width of 1000px and, by definition, an offset of 0. The numerical pair `(offset, width)` of a partial landscape is called its **region**. A region X is said to encompass another region Y if every pixel in Y is also in X.

Remember that a visual style draws discrete, uniformly-spaced data points. Thus, given the total number of data points, a visual style can determine how wide a complete landscape will be. Moreover, it can even compute the regions of partial landscapes given a **range** of points. A range is a pair `(start, length)` which represents a set of data points in the *DataSource*. In other words, a range is the *DataSource* analog of regions. A range X is said to encompass another range Y if every data point in Y is also in X.

# The Region type

A region stores the horizontal offset and width of a partial landscape. The Region type has two fields:

 * *number* left - the left offset of the described partial landscape in pixels.
 * *number* width - the width of the described partial landscape in pixels.

# The Range type

The Range type represents a list of data points in a *DataSource*. It has two fields:

 * *int* startIndex - the start index of the theoretical chunk.
 * *int* length - the number of data points in the theoretical chunk.

# The VisualStyle type

The visual style is an abstract piece of information used for drawing data points. The *VisualStyle* interface is a concrete JavaScript implementation of this abstract information.

Note that the *VisualStyle* interface itself does not do everything that a visual style does. For instance, a visual style includes information about animations, while a *VisualStyle* provides no direct information about animations. Rather, the *ChunkView*s that a *VisualStyle* creates handle animations.

## Methods

 * [Range](#the-range-type) computeRange(region, pointCount) - compute the smallest range such that, if a *ChunkView* were created with that range, the region of its partial landscape would encompass the given region. If the answer is ambiguous (i.e. two or more ranges yield the same result), this should return the one with the greatest startIndex. If the given region extends below an offset of 0 or above the width of the complete landscape, it will be cropped. You must pass pointCount in order for the *VisualStyle* to compute information about the complete landscape.
 * [Region](#the-region-type) computeRegion(range, pointCount) - compute the region of the partial landscape of the *ChunkView* which would be created for a given range. You must pass the pointCount in order for the *VisualStyle* to compute information about the complete landscape. The indices within the given range will be cropped so as not to exceed the *DataSource*.
 * [ChunkView](ChunkView.md) createChunkView(chunk, dataSource) - create a *ChunkView* for the given chunk.
 * *number* xLabelPosition(pointIndex, pointCount) - for a given point index, return an offset in the complete landscape. This offset may be used for positioning x-axis labels, although the way it is used is specific to the *ContentView*.

## Events

When the data or any visual settings change, a *ViewProvider* may emit the following events:

 * metricChange() - the visual style changed in some way which may affect the regions of partial landscapes. *ChunkView*s created before the change will be unaffected, meaning they should be recreated if you wish to use the new visual style.
 * superficialChange() - the visual style changed in some way which does not affect the regions of any partial landscapes. *ChunkView*s created before the change will be updated automatically. This event exists to notify *ContentView*s that they should redraw their content.
