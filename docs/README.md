# Documentation

Graphalicious uses a number of abstractions to represent graphs. Reading the following documents will give you a good idea of these abstractions:

 * [DataSource](DATA_SOURCE.md) - the structure of underlying data and its source.
 * [ContentView](ContentView/CONTENT_VIEW.md) - the top-level view for displaying graph content
 * [ChunkView](ViewProvider/CHUNK_VIEW.md) - the lowest-level view for displaying graph content
 * [ViewProvider](ViewProvider/VIEW_PROVIDER.md) - the intermediary between *ContentView* and *ChunkView*.

Now that you have a general sense of some abstractions, you can read about specific views which graphalicious provides out of the box:

 * [YLabelContentView](ContentView/Y_LABEL_CONTENT_VIEW.md) - a general-purpose [ContentView](ContentView/CONTENT_VIEW.md) implementation which renders y-axis labels along with its content. This class handles lazy loading and uses two abstract views for loading animations:
   * [SplashScreen](ContentView/SPLASH_SCREEN.md) - an abstract loading screen which can be displayed before content is loaded.
   * [InlineLoaderView](ContentView/INLINE_LOADER_VIEW.md) - an abstract loading animation which can be displayed next to content while more content is loading.
