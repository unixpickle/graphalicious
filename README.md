# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal), [eventemitter.js](https://github.com/unixpickle/eventemitter.js), [harmonizer](https://github.com/unixpickle/harmonizer) and [scroller.js](https://github.com/unixpickle/scroller.js).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script, [build.sh](build.sh).

# TODO

 * Fix issue where arrow of upward facing blurb goes under scrollbar
 * Figure out how alternating x-axis labels will work
 * Implement YLCV subclass for x-axis labels
 * Optimize CurveChunkView by caching a bitmap of the spline so that the path does not need to be re-stroked on every paint(). This will improve performance of the blurb and of scrolling on slower machines or for people with wide browser windows.

# License

See [LICENSE](LICENSE)
