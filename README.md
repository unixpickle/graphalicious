# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script.

# TODO

 * Fix existing YLCV before conducting YLCV rewrite
   * Predict scrolling when computing y-axis labels
   * Fix bug where spinner shows over splash screen.
 * Implement mean graph
   * Ask for more points than we render so we can show a full average line.
   * Revise VisualStyle docs to make sure the above behavior is acceptable.
 * Rewrite YLCV and revise *View* architecture
   * Document *View*
   * Document *ColorScheme*
   * Give *ContentView* complete power over scrolling and drawing
   * Do not attempt to use a finite state machine
   * Separate base class for handling 300ms delay for splash screen
   * Create pointer event pipeline (View -> ContentView (YLCV) -> ChunkView)
   * Prevent selection of canvas in graph.
 * Implement pointer events in BarChunkView.
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
