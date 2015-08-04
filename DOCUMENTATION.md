# The *content* interface

*Content* represents some sort of raw graph, whether it be a bar graph, a line graph or a point graph. Content can change at any time and must deliver events for changes. Content will always have a minimum width, making it possible to determine whether or not it must scroll.

## Events

The *content* interface should emit these events:

 * **change**() - the content has changed.

## Methods

The *content* interface should implement these methods:

 * **draw**(startX, viewport) - draw the content (or a sub-frame of the content) inside a viewport.
 * **getMinimumWidth**() - get the minimum width needed to display the content without scrolling.
 * **getMaxValueInFrame**(startX, width) - get the maximum value (for the y-axis labels) within the given clipped region.
