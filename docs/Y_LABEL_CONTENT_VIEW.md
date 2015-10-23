# Abstract

A *YLabelContentView* (YLCV) is a concrete [ContentView](CONTENT_VIEW.md) implementation which takes care of many UI-level rendering problems such as lazy loading and y-axis label animations.

# UI & UX

A YLCV can be in several different visual states. At first, it will display a [SplashScreen](SPLASH_SCREEN.md) while data is loaded from the [DataSource](DATA_SOURCE.md). After this data has loaded, the YLCV will render the data along with nicely formatted and spaced y-axis labels. The YLCV lazily loads more content as the user scrolls. If more content takes a long time to load, the user will see a visual cue that more data is loading.

To keep the scale relevant to the visible data, the YLCV re-computes y-axis labels as the user scrolls or as content changes. The YLCV also re-computes the width of the y-axis labels whenever they change. Most of the time, the y-axis labels "cover" the left part of the viewport. This makes scrolling smoother, since the content does not get shifted whenever the y-axis labels change. When the user is scrolled all the way to the left, the leftmost [ChunkView](CHUNK_VIEW.md) is rendered to the right of the y-axis labels, allowing the leftmost data points to be seen. In this case, there is no content for the y-axis labels to cover.

The width of the content is the width of the [ViewProvider](VIEW_PROVIDER.md) plus the width of the **leftmost y-axis labels**. The leftmost y-axis labels are the axis labels which the user would see when scrolled all the way to the left of the content. The leftmost y-axis labels may change if the graph's viewport width or height changes.

Whenever the [ChunkView](CHUNK_VIEW.md) performs an animation, the y-axis labels, content width, and various other attributes may change. The YLCV does its best to animate these changes while the [ChunkView](CHUNK_VIEW.md) does its thing.

# The LabelSettings type

The *LabelSettings* class stores and manipulates visual settings for drawing y-axis labels. The *LabelSettings* constructor takes an object with the following attributes:

 * *int* leftMargin - the minimum number of pixels which should appear to the left of the text of any label
 * *int* rightMargin - the minimum number of pixels which should appear to the right of the text of any label
 * *string* color - a CSS color string
 * *string* font - a CSS font string
 * *number* opacity - the global opacity at which to draw the labels

# The Labels interface & type

The *Labels* interface provides methods for measuring and drawing labels. The YLCV implementation comes with an implementation of this interface, also called *Labels*.

The *Labels* interface has the following methods:

 * *number* width() - get the width of the labels in pixels
 * *bool* equals(labels) - return true if and only if this object is equivalent to another labels object. Both instances are guaranteed to be created using the same [LabelGenerator](#the-labelgenerator-interface).
 * *void* draw(context, leftX, topY, bottomY) - draw the labels in the given 2D drawing context at the left offset with the height requirements. Note that *Labels* can be vertically stretched or compressed by changing the distance between topY and bottomY.

The *Labels* implementation which ships with YLabelContentView can be constructed as follows:

 * Labels(text, values, settings) - create a *Labels* object with the specified settings, label text, and label values. The `text` and `values` arguments must be arrays with the same number of elements. These arrays must have two or more elements.

# The LabelGenerator interface

A *YLabelContentView* uses a *LabelGenerator* to generate the y-axis labels that it draws. These generators must implement the following method:

 * *Labels* createLabels(maxValue, height) - generate *Labels* which span from 0 to `maxValue` which fit nicely in `height` pixels (i.e. without being stretched to a visually displeasing degree).

# Construction

The *YLabelContentView* constructor takes one object argument. This object must have the following keys:

 * [ViewProvider](VIEW_PROVIDER.md) provider
 * [DataSource](DATA_SOURCE.md) dataSource
 * [SplashScreen](SPLASH_SCREEN.md) splashScreen
 * [InlineLoaderView](INLINE_LOADER_VIEW.md) loader1
 * [InlineLoaderView](INLINE_LOADER_VIEW.md) loader2
 * [LabelGenerator](#the-labelgenerator-interface) labelGenerator
 * *number* topMargin
 * *number* bottomMargin

# Methods

A *YLabelContentView* implements all the same methods as a *ChunkView*:

 * *int* totalWidth() - get the current total width of the content, meaning the width of the leftmost y-axis labels plus the width taken from the *ViewProvider* or *ChunkView*. This will be 0 while the *SplashScreen* is showing.
 * *DOMElement* element() - get the visual DOM element for the view.
 * *void* draw(viewportX, viewportWidth, height, barShowingHeight) - draw a portion of the content to fit inside a viewport. If viewport width is greater than the total width, then viewportX must be 0 and the *ContentView* will be "stretched".
 * *void* setAnimate(flag) - enable or disable animations. While animations are disabled on the YLCV, they will also be disabled on the current *ChunkView*, *SplashScreen* and *InlineLoaderView*s.

It implements more methods, too:

 * *void* dispose() - completely destroy any resources being consumed by the YLCV. This stops the YLCV from accessing the *InlineLoaderView*s, the *SplashScreen*, the *DataSource*, and the *ViewProvider*.

# Events

A *YLabelContentView* emits all the same events as a *ChunkView*:

 * widthChange() - the total width of the YLCV has changed. This may occur if the splash screen appears or disappears, if the *ChunkView* is animating, if the leftmost y-axis labels change, or various other reasons. If the YLCV is being displayed in a *View*, this will automatically trigger a `draw`.
 * redraw() - the YLCV has visually changed in some way and wants an opportunity to redraw itself. This may occur if the *ChunkView* changes, the y-axis labels change, the user scrolls, or a host of other reasons. If the YLCV is being displayed in a *View*, this will automatically trigger a `draw`.
