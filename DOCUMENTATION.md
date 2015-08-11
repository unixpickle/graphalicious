# The *content* interface

*Content* represents some sort of raw graph, whether it be a bar graph, a line graph or a point graph. Content can change at any time and must deliver events for changes. Content will always have a minimum width, making it possible to determine whether or not it must scroll.

Content does not have to reside on the client. It can load lazily from a server.

## Events

The *content* interface should emit these events:

 * **change**() - the content has changed.
 * **redraw**() - the content has remained mostly unchanged, but it must be redrawn because of a visual change (e.g. a color scheme change).

## Methods

The *content* interface includes these methods:

 * **fetchFragment**(startX, width, callback) - fetch a fragment which encompasses a range of pixels within the graph. The returned fragment may start before the request region and may end after the requested region. The callback will be called with the arguments (err, fragment). If err is non-null, an error occurred while fetching the fragment. Otherwise, the fragment will be non-null. This method returns a [Ticket object](#ticket-object).
 * **fetchFullFragment**(callback) - fetch a fragment which includes all of the content at once. This should be used with caution since the content may be backed by a lot of data.
 * **formatYLabel**(value) - format a value for presentation in the y-axis.
 * **minWidth**() - get the minimum width needed to display the content without scrolling.
 * **niceYAxisDivisions**(maxValue, numDivisions) - given a maxValue and a number of divisions, compute the values for each division in a graph. These should be ordered from lowest to highest. The highest value must be greater than or equal to maxValue.

# The *fragment* interface

A fragment represents a synchronous, immutable, client-side piece of content. A fragment knows more about its contained data than content, but may not be aware of the entire dataset.

## Methods

The *fragment* interface should implement these methods:

 * **draw**(maxY, startX, viewport) - draw a sub-frame of the content inside a viewport. The maxY argument specifies the range of y values that the graph is showing. The startX value is relative to the underlying content, but it will never be out of the fragment's bounds. Likewise, (startX+viewport.width()) will never be out of the fragment's bounds.
 * **drawFull**(maxY, viewport) - draw the entire fragment within a viewport. The fragment can decide how it draws itself in a viewport that is wider than its content's minWidth.
 * **getAllXLabels**(width) - get a list of [XLabel](#xlabel-object) objects for this fragment when it is fully drawn and (possibly) stretched horizontally.
 * **getHighlightX**() - get the x coordinate of the "highlight", relative to the content. If no highlight exists, this should return `null`.
 * **getHighlightXFull**(width) - get the x coordinate of the "highlight", relative to the content, when the fragment is fully drawn and (possibly) stretched. If no highlight exists, this should return `null`.
 * **getStartX**() - get the startX of this fragment (relative to the content as a whole).
 * **getWidth**() - get the width of this fragment.
 * **getXLabels**(startX, width) - get a list of [XLabel](#xlabel-object) objects for a range of this fragment.
 * **maxValue**() - get the maximum value in the entire fragment.
 * **maxValueInFrame**(startX, width) - get the maximum value within a range of the fragment. Just like **draw**, startX and (startX+width) will always be within the bounds of the fragment.

<a name="ticket-object"></a>
# Tickets

A Ticket object represents an asynchronous fetch operation. It must implement the following methods:

 * **cancel**() - cancel the asynchronous fetch operation.

<a name="xlabel-object"></a>
#XLabel

An XLabel represents a label along the x-axis. An XLabel object has two attributes:

 * **text** - the text of the label
 * **x** - the x value that this label points to, relative to the content
