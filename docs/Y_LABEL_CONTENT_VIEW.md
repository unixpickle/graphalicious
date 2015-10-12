# Abstract

A *YLabelContentView* (YLCV) is a concrete [ContentView](CONTENT_VIEW.md) implementation which takes care of many UI-level rendering problems such as lazy loading and y-axis label animations.

# What it looks like

A YLCV can be in several different visual states. At first, it will display a [SplashScreen](SPLASH_SCREEN.md) while data is loaded from the [DataSource](DATA_SOURCE.md). After this data has loaded, the YLCV will render the data along with nicely formatted and spaced y-axis labels. The YLCV lazily loads more content as the user scrolls. If more content takes a long time to load, the user will see a visual cue that more data is loading.

To keep the scale relevant to the visible data, the YLCV re-computes y-axis labels as the user scrolls or as content changes. The YLCV also re-computes the width of the y-axis labels whenever they change. Most of the time, the y-axis labels "cover" the left part of the viewport. This makes scrolling smoother, since the content does not get shifted whenever the y-axis labels change. When the user is scrolled all the way to the left, the leftmost [ChunkView](CHUNK_VIEW.md) is rendered to the right of the y-axis labels, allowing the leftmost data points to be seen. In this case, there is no content for the y-axis labels to cover.

The width of the content is the width of the [ViewProvider](VIEW_PROVIDER.md) plus the width of the **leftmost y-axis labels**. The **leftmost y-axis labels** are the axis labels which the user would see when scrolled all the way to the left of the content. The **leftmost y-axis labels** may change if the graph's viewport width or height changes.
