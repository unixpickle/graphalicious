# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal), [eventemitter.js](https://github.com/unixpickle/eventemitter.js), and [scroller.js](https://github.com/unixpickle/scroller.js).

This also uses the window.requestAnimationFrame API.

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script, [build.sh](build.sh).

# TODO

 * Unify animations throughout the ContentView so that blurbs, graph animations, and x-label animations can all trigger the same draw() per animation frame.
 * Fix issue where arrow of upward facing blurb goes under scrollbar
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels

# License

See [LICENSE](LICENSE)
