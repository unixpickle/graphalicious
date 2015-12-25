# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal), [eventemitter.js](https://github.com/unixpickle/eventemitter.js), and [scroller.js](https://github.com/unixpickle/scroller.js).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script, [build.sh](build.sh).

# TODO

 * Rewrite YLCV and revise *View* architecture
   * Implement animations
     * When animations start, we reset our needs to indicate that we do not need anything.
     * When animations stop, we will update our needs because we stopped any loads when the animation began.
   * Handle metric changes
     * Scroll to keep the middle visible point in sight so that the content doesn't scroll off completely.
   * Prevent DOM selection of canvas in graph
 * Implement pointer events (blurbs) in the bar style
 * Implement pointer events in the other styles
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
