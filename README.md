# Graphalicious

This will be a tremendously beautiful graphing API.

# Dependencies

This depends on [crystal](https://github.com/unixpickle/crystal).

# Building

You must have [jsbuild](https://github.com/unixpickle/jsbuild) installed in order to use the build script.

# TODO

 * Figure out how loading and errors will be handled.
   * When the user scrolls to the left and new data does not load quickly.
   * When the user scrolls to the left and new data fails to load altogether.
   * When the user transitions to a new stage and the new stage does not load quickly.
   * When the user transitions to a new stage and the new stage fails to load.
   * When the content changes and the stage cannot get fragments from it quickly.
   * When the content changes and the stage fails to get fragments from it.
   * When the canvas is resized and it triggers some kind of reload that does not go quickly.
     * What about when it is made so wide that the content no longer needs to scroll and even gets stretched? Oh boy.
   * When the canvas is resized and it triggers some kind of reload that fails altogether.
 * Figure out a nice way to implement stage transitions.
 * Create test content which has built-in lag and random errors.
 * Implement BaseStage *somehow*

# License

See [LICENSE](LICENSE)
