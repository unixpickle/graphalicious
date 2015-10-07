# Abstract

So far you have seen that a [DataSource](DATA_SOURCE.md) provides chunks of data, a [ChunkView](CHUNK_VIEW.md) renders those chunks, and a [ContentView](CONTENT_VIEW.md) renders everything shown in a graph. It seems that a *ContentView* should make use of *ChunkView*s for drawing, but there is an essential piece missing from the picture.

The *ViewProvider* uses a data source to generate *ChunkView*s for its parent view to draw. It also provides various layout information, allowing the *ContentView* to determine its total width before any *ChunkView*s have been created.

# Methods

 * *int* getWidthApproximation() - get an approximation of the inherent width of the complete *ChunkView* for the current data source.
 * *int* pointCountForWidth(width) - get the minimum number of points required for a *ChunkView* to fill up at least a certain width.
 * [ChunkView](CHUNK_VIEW.md) createChunkView(chunk) - create a chunk view for the given chunk.

# Events

When the data or any visual settings change, a *ChunkView* may emit the following events:

 * widthApproximationChange() - the width approximation changed. This may be due to a changed visual setting (e.g. a change in scale), or to a data change (e.g. a new point).
 * pointCountForWidthChange() - the point count for a given width may now be different than it was before. This may occur when a visual setting (e.g. scale) changes.
