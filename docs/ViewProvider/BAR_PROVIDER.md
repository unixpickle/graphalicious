# Abstract

*BarProvider* is an implementation of the [ViewProvider](#VIEW_PROVIDER.md) interface. It draws what are traditionally known as "bar graphs". It supports various customizations such as color, bar width, and horizontal spacing.

# Overview & Terminology

A bar graph is laid out according to a number of horizontal metrics. The **left margin** is the number of pixels between the leftmost bar and the beginning of the content. Likewise, the **right margin** is the number of pixels between the rightmost bar and the end of the content. The **bar spacing** specifies the number of pixels separating each bar in the graph. Perhaps most importantly, the **bar width** is the width, in pixels, of each bar in the graph.

There are two ways a bar graph can handle stretching. The first way is to **justify** the graph to the left or the right of the viewport. When the bar graph is justified, it is drawn at its normal scale and moved all the way to one side of the viewport. The other way is to **elongate** the graph. When a bar graph is elongated, its bar width, margins, or bar spacing may increase.

As a full-fledged *ViewProvider* with complementary *ChunkView*s, bar graphs support a number of animations. These animations may be turned off selectively.
