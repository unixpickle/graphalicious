# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal) and [eventemitter.js](https://github.com/unixpickle/eventemitter.js).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script, [build.sh](build.sh).

# TODO

 * Rewrite YLCV and revise *View* architecture
   * Use scroller.js for view
   * Do not attempt to use a finite state machine
   * Separate base class for handling 300ms delay for splash screen
   * Create pointer event pipeline (View -> ContentView (YLCV) -> ChunkView)
   * Prevent selection of canvas in graph.
 * Implement pointer events in BarChunkView.
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
