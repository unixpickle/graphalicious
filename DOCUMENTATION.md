# The *content* interface

*Content* represents some sort of raw graph, whether it be a bar graph, a line graph or a point graph. Content can change at any time and must deliver events for changes. Content will always have a minimum width, making it possible to determine whether or not it must scroll.

## Events

The *content* interface should emit these events:

 * **change**() - the content has changed.

## Methods

The *content* interface should implement these methods:

 * **draw**(startX, viewport) - draw the content (or a sub-frame of the content) inside a viewport.
 * **formatYLabel**(value) - format a value for presentation in the y-axis.
 * **getFontFamily**() - get the font family for axis labels.
 * **getFontSize**() - get the font size for axis labels.
 * **getFontWeight**() - get the font weight for axis labels.
 * **maxValueInFrame**(startX, width) - get the maximum value (for the y-axis labels) within the given clipped region.
 * **minWidth**() - get the minimum width needed to display the content without scrolling.
 * **niceYAxisDivisions**(maxValue, numDivisions) - given a maxValue and a number of divisions, compute the values for each division in a graph. These should be ordered from lowest to highest. The highest value must be greater than or equal to maxValue.
