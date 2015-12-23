# Abstract

A YLabelContentView (YLCV) is a concrete [ContentView](ContentView.md) implementation that deals with lazy loading, y-axis labels, and animations.

# UI & UX

A YLCV can be in several different visual states. At first, it will display a [SplashScreen](SplashScreen.md) while data is loaded from the [DataSource](../DataSource.md). After this data has loaded, the YLCV will render the data along with nicely formatted and spaced y-axis labels. The YLCV lazily loads more content as the user scrolls. If more content takes a long time to load, the user will see one or two [InlineLoaderView](InlineLoaderView.md)s.

The YLCV re-computes y-axis labels as the user scrolls or as content changes. It also re-computes the width of the y-axis labels whenever they change. Most of the time, the y-axis labels laid over the left part of the viewport. When the user is scrolled all the way to the left, the leftmost [ChunkView](ChunkView.md) is rendered to the right of the y-axis labels, allowing the leftmost data points to be seen. In this case, there is no content for the y-axis labels to cover.

The width of the content is the width of the [VisualStyle](../VisualStyle/VisualStyle.md) plus the width of the **leftmost y-axis labels**. The leftmost y-axis labels are the axis labels which the user would see when scrolled all the way to the left of the content. The leftmost y-axis labels may change after a layout.

Whenever the [ChunkView](ChunkView.md) performs an animation, the y-axis labels, content width, and various other attributes may change. The YLCV does its best to animate these changes while the [ChunkView](ChunkView.md) does its thing.

# The YLCVSettings type

The *YLCVSettings* type stores all of the configuration parameters for a YLCV. It has the following attributes:

 * [VisualStyle](../VisualStyle/VisualStyle.md) visualStyle
 * [DataSource](../DataSource.md) dataSource
 * [SplashScreen](SplashScreen.md) splashScreen
 * [InlineLoaderView](InlineLoaderView.md) loader1
 * [InlineLoaderView](InlineLoaderView.md) loader2
 * *number* topMargin - the number of pixels above the content.
 * *number* bottomMargin - the number of pixels below the content.
 * *number* labelLeftMargin - the space to the left of the text of any label.
 * *number* labelRightMargin - the space to the right of the text of any label.
 * *string* labelColor - a CSS color used for labels.
 * *string* labelFont - a CSS font used for labels.
 * *function* formatValue - convert a primary value into a string for a label.
 * *function* roundValue - a function for rounding up primary values. The YLCV applies this to the lowest non-zero label value and uses integer multiples of the result for the rest of the labels.
 * *number* topLabelSpace - a pixel quantity which determines the minimum space between a value in the graph and the maximum label's value. Let `x` be the height of the YLCV, minus the top and bottom margins. Then `((maximalLabelValue-maximalValue)/maximalLabelValue)*x >= topLabelSpace`.
 * *number* minSpacing - the minimum number of pixels between any two y-axis labels.

# Construction

To create a new YLCV, call its constructor and pass a [YLCVSettings](#the-ylcvsettings-type) object.

```js
var ylcv = new window.graphalicious.ylcv.View(settings);
```

# Built-in interpretations

The formatValue and roundValue functions from [YLCVSettings](#the-ylcvsettings-type) are responsible for **interpreting** data&mdash;turning it into human-readable text. The YLCV implementation comes with a few utilities for interpreting data.

## DurationInterpretation

The *DurationInterpretation* class formats primary values as if they were durations of time, measured in milliseconds. It makes sure that labels are divided into pretty durations (e.g., 250 milliseconds, 5 seconds, etc.), and formats durations in a human-readable fashion (e.g., "3:45.32"). To construct one, you can do the following:

```js
var interp = new DurationInterpretation(config);
```

The configuration constructor argument has the following keys:

 * *Array* divisions - an array of millisecond values. These are used for rounding values. For instance, you might wish to use the divisions `[250, 1000, 5000]` to specify that labels should either be multiples of 250 milliseconds, 1 second, or 5 seconds. If you do not specify this, a reasonable default will be used.
 * *int* decimals - the number of decimal places to use when formatting durations. This should be between 0 and 3, inclusive. If you do not specify this, a default will be used.

The *DurationInterpretation* implements the following methods:

 * *number* round(x) - implements the roundValue YLCV setting.
 * *string* format(x) - implements the formatValue YLCV setting.
