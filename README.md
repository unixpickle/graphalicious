# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script.

# TODO

 * Implement state computations in YLCV
   * Methods to update positive state
   * Methods to update normative state
 * Implement dummy ChunkView and ViewProvider in demo
 * Implement draw routines in StateView
   * Regular drawing and mid-animation drawing
 * Create pointer event pipeline (View -> ContentView (YLCV) -> ChunkView)
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
