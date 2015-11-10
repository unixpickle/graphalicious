# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script.

# TODO

 * Prevent selection of canvas in graph.
 * Add secondary value options to demo
 * Rethink having showingContent be an actual state field instead of a method
   * On second thought, just rewrite YLCV to not be stateful
 * Create BarGraphViewProvider.
 * Create DotGraphViewProvider.
 * Create SplineGraphViewProvider.
 * Create pointer event pipeline (View -> ContentView (YLCV) -> ChunkView)
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
