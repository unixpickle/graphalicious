# Abstract

*BarStyle* is an implementation of the [VisualStyle](VisualStyle.md) interface. It draws what are traditionally known as "bar graphs". It supports various customizations such as color, bar width, and horizontal spacing.

# Overview & Terminology

A bar graph is laid out according to a number of horizontal metrics. The **left margin** is the number of pixels between the leftmost bar and the beginning of the content. Likewise, the **right margin** is the number of pixels between the rightmost bar and the end of the content. The **bar spacing** specifies the number of pixels separating each bar in the graph. Perhaps most importantly, the **bar width** is the width, in pixels, of each bar in the graph.

The most simple way to deal with stretching is to **elongate** the graph. When this happens, the bars, margins, and spacing are widened as needed to fill the *ContentView*. You can set a maximum **elongation factor**, limiting how elongated a graph can become. By default, the elongation factor is 1, which signals that elongation is now allowed. When the elongation factor is `Infinity`, the graph will always elongate as much as possible.

When the bar graph is elongated to its maximum elongation factor but is still fails to span the *ContentView*, it will **justify** itself. When the bar graph is justified, it is moved to a certain position in the viewport. For instance, you can set the bar graph to justify itself to the center of the viewport, or you can have it justify itself to the right.

As a full-fledged *VisualStyle* with complementary *ChunkView*s, bar graphs support a number of animations. These animations may be turned off selectively.
