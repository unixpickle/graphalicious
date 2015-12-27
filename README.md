# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal), [eventemitter.js](https://github.com/unixpickle/eventemitter.js), and [scroller.js](https://github.com/unixpickle/scroller.js).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script, [build.sh](build.sh).

# TODO

 * Rewrite YLCV and revise *View* architecture
   * Make the view set the state of the loaders and splash screen.
   * Implement animations
     * When animations start, we reset our needs to indicate that we do not need anything.
     * When animations stop, we will update our needs because we stopped any loads when the animation began.
 * Implement pointer events (blurbs) in the bar style
 * Implement pointer events in the other styles
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
