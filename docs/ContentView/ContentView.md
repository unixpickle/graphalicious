# Abstract

While having a [DataSource](../DataSource.md) is nice, data is only half the story. The other half is how the data is displayed. A *ContentView* is responsible for rendering a [DataSource](../DataSource.md) using a [VisualStyle](../VisualStyle/VisualStyle.md).

# Overview & Terminology

A *ContentView* manages a **scrolling state** (as documented [in scroller.js](https://github.com/unixpickle/scroller.js#the-state-class)). Both the user and the *ContentView* itself can modify the scrolling state. If the user (or some external agent) scrolls, the offset of the scrolling state will change. If the *ContentView* needs to display more or less content, or if its underlying style changes metrically, it will update its scrolling state as well.

A *ContentView* does not determine its own size. An external agent (usually a [View](../View.md)) determines the *ContentView*'s size. In turn, the *ContentView* is responsible for dealing with size changes and updating its scrolling state accordingly.

It would be silly for an off-screen *ContentView* to perform animations. Therefore, it is possible to tell a *ContentView* whether or not it should show animations.

The *ContentView* is responsible for managing *ChunkView*s. For instance, it is responsible for passing pointer events from its parent *View* to its child *ChunkView*. In addition, it must add the current *ChunkView*'s *Harmonizer* to its root harmonizer so that it responds to the *ChunkView*'s redraw requests.

# Methods

A *ContentView* must implement the following methods:

 * [State](https://github.com/unixpickle/scroller.js#the-state-class) getScrollState() - get the *ContentView*'s current scroll state.
 * *void* setScrolledPixels(pixels) - update the scroll offset of the *ContentView*'s scrolling state.
 * *DOMElement* element() - get the visual DOM element for the view. This element should use absolute positioning. The *ContentView* must set its width appropriately.
 * [Harmonizer](https://github.com/unixpickle/harmonizer) harmonizer() - get the *ContentView*'s root *Harmonizer*.
 * *void* layout(width, height) - update the *ContentView*'s dimensions.
 * *void* setAnimate(flag) - enable or disable animations.
 * *void* dispose() - tell the *ContentView* to deregister all of its events and remove references to its resources (such as the DataSource, the VisualStyle, and its ChunkViews).
 * *void* pointerMove(pos) - this is a pointer event which the *ContentView* should faithfully pass along to its current *ChunkView*, if it has one. If not, it should pass the movement along to the next *ChunkView* it gets. In addition, if the *ChunkView* is replaced, the *ContentView* should make the same call to the new *ChunkView*, essentially handing off the current cursor position.
 * *void* pointerClick(pos) - this is a pointer event intended for the *ChunkView*.
 * *void* pointerLeave() - this is a pointer event intended for the *ChunkView*.

# Events

A *ContentView* may emit the following event:

 * scrollingStateChange() - the *ContentView* has changed its scrolling state. This will not be triggered by *setScrolledPixels()*. However, this may be triggered by a *layout()*, since changing the *ContentView*'s width will also change the scrolling state's visible pixels.
