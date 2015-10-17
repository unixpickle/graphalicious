# Abstract

So far you have seen that a [DataSource](DATA_SOURCE.md) provides chunks of data, a [ChunkView](CHUNK_VIEW.md) renders those chunks, and a [ContentView](CONTENT_VIEW.md) renders everything shown in a graph. It seems that a *ContentView* should make use of *ChunkView*s for drawing, but there is an essential piece missing from the picture.

A *ViewProvider* can create new *ChunkView*s. It can also predict how large *ChunkView*s will be and where they will be situated. Using a *ViewProvider*, a *ContentView* can deteremine how many and which points it ought to fetch in order to get a *ChunkView* with the required parameters.

# Overview & Terminology

A **visual style** is a means of presenting uniformly spaced data points. For example, a bar graph with 50 pixel bars, 10 pixel spacing, and 20 pixel margins is a visual style. A visual style in and of itself determines the width of a certain number of data points. In a sense, a *ViewProvider* is the embodiment of a visual style. All of a *ViewProvider*'s calculations are done based on the visual style it represents. A *ViewProvider* creates *ChunkView*s which reflect its current visual style.

A **theoretical ChunkView** is an abstract concept used to refer to a *ChunkView* which has not yet been created. A **theoretical chunk** is a pair of numbers (start index and length) representing the position and size of a chunk.

A *ViewProvider* can compute the **region** of the theoretical *ChunkView* which corresponds to a theoretical chunk. A region is a horizontal range of pixels represented as a pair of numbers (left offset and a width). In other words, a *ViewProvider* can predict where and how large any actual *ChunkView* will be once it is created.

A *ViewProvider* can also compute a theoretical chunk whose theoretical *ChunkView* would cover a given region. In other words, it can figure out which points need to be loaded in order to cover a given region.

One thing to note is that a *ViewProvider* does not worry itself with animations. All it knows about is theoretical *ChunkView*s in their non-animating state.

# The Region type

The Region type has two fields:

 * *number* left - the left offset of the region in pixels.
 * *number* width - the width of the region in pixels.

# The TheoreticalChunk type

The TheoreticalChunk type has two fields:

 * *int* startIndex - the start index of the theoretical chunk.
 * *int* length - the number of data points in the theoretical chunk.

# Methods

 * [TheoreticalChunk](#the-theoreticalchunk-type) computeTheoreticalChunk(region, pointCount) - compute the smallest theoretical chunk whose theoretical *ChunkView* would cover the given region. You must pass the number of points in the data source so that margins can be accounted for. The returned theoretical chunk will be bounded so that its indices are not negative and do not exceed the point count.
 * [Region](#the-region-type) computeRegion(theoreticalChunk, pointCount) - compute the region of the theoretical *ChunkView* for a theoretical chunk. You must pass the number of points in the data source so that margins can be accounted for. The indices within the theoretical chunk can be negative or exceed the point count; they will be bounded to valid values during the computation.
 * [ChunkView](CHUNK_VIEW.md) createChunkView(chunk, dataSource) - create a *ChunkView* for the given chunk.

# Events

When the data or any visual settings change, a *ChunkView* may emit the following events:

 * change() - the visual style changed in some way. *ChunkView*s created before the visual style change will be unaffected by the change.
