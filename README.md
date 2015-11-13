# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script.

# TODO

 * Prevent selection of canvas in graph.
 * Clean up and clarify ChunkView docs
 * Implement BarProvider with actual options
   * Animations
   * Color scheme changes
   * Secondary values
 * Rewrite YLCV and revise *View* architecture
   * Document *View* better
   * Give *ContentView* complete power over scrolling and drawing
   * Do not attempt to use a finite state machine
   * Separate base class for handling 300ms delay for splash screen
 * Create DotGraphViewProvider.
 * Create SplineGraphViewProvider.
 * Create pointer event pipeline (View -> ContentView (YLCV) -> ChunkView)
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
