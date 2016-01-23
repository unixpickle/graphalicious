# Documentation

Graphalicious uses a number of abstractions to represent graphs. Reading the following documents will give you a good idea of these abstractions:

 * [DataSource](DataSource.md) - the structure of underlying data and its source.
 * [ContentView](ContentView/ContentView.md) - the top-level view for displaying graph content
 * [VisualStyle](VisualStyle/VisualStyle.md) - a specific way of rendering data inside a ContentView.

Now that you have a general sense of some abstractions, you can read about specific views which graphalicious provides out of the box:

 * [YLabelContentView](ContentView/YLabelContentView.md) - a general-purpose [ContentView](ContentView/ContentView.md) implementation which renders y-axis labels along with its content. This class handles lazy loading and uses two abstract views for loading animations:
   * [SplashScreen](ContentView/SplashScreen.md) - an abstract loading screen which can be displayed before content is loaded.
   * [InlineLoaderView](ContentView/InlineLoaderView.md) - an abstract loading animation which can be displayed next to content while more content is loading.
 * [BarStyle](VisualStyle/BarStyle.md) - a VisualStyle that draws bar graphs.
