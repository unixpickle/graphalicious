# Abstract

While having a [DataSource](DATA_SOURCE.md) is nice, data is only half the story. The other half is how the data is displayed. A *ContentView* is responsible for rendering a [DataSource](DATA_SOURCE.md).

# Overview & Terminology

The **total width** of a *ContentView* is the minimum width required to display it without scrolling. When a *ContentView* has a small enough total width to be rendered without scrolling, it may be asked to "stretch" itself&mdash;that is, fill more space than it's total width.

Often times, a *ContentView* will need to scroll. In this case, there are a few measurements which have names. The **viewport width** is the width, in pixels, that can be visible at any given time. The **scroll value** represents the number of pixels to the right the user has scrolled. A scroll value of 0 means the leftmost content is visible. A scroll value of (total width - viewport width) means that the user is scrolled all the way to the right.

When a *ContentView* is being drawn, its **height** measures how many pixels tall the view is. The **bar-showing height** is the height that the *ContentView* would have if a scrollbar were showing underneath it. If the *ContentView* scrolls, the height will equal the bar-showing height. The bar-showing height is useful for *ContentView*s which change their appearance based on their height, since it allows them to keep their appearance relatively constant when the scrollbar shows or hides.

It would be silly for an off-screen *ContentView* to perform animations. Therefore, it is possible to tell a *ContentView* whether or not it should show animations.

Remember that a *DataSource* emits various events for remote changes. Since a *ContentView* is a visual representation of a *DataSource*, it can be affected by the same kinds of remote changes. At any time, a *ContentView* can redraw itself or change it's total width.

# Methods

A *ContentView* must implement the following methods:

 * *int* totalWidth() - get the current total width of the *ContentView*.
 * *DOMElement* element() - get the visual DOM element for the view
 * *void* draw(viewportX, viewportWidth, height, barShowingHeight) - draw a portion of the content to fit inside a viewport. If viewport width is greater than the total width, then viewportX must be 0 and the *ContentView* will be "stretched".
 * *void* setAnimate(flag) - enable or disable animations.

# Events

A *ContentView* may emit the following events:

 * widthChange(keepRightOffset) - the total width of the *ContentView* has changed. If the *ContentView* is being displayed in a *View*, this will automatically trigger a `draw`. The `keepRightOffset` argument is a boolean. If it is true, then the *View* should update the scroll position so that the rightmost edge of the *ContentView* stays the same distance from the rightmost edge of the viewport if possible.
 * redraw() - the *ContentView* has changed and wants an opportunity to redraw itself. If the *ContentView* is being displayed in a *View*, this will automatically trigger a `draw`.
