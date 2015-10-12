# Abstract

A *SplashScreen* is used by a [YLabelContentView](Y_LABEL_CONTENT_VIEW.md) to visually indicate that the graph is loading. The *SplashScreen* is also responsible for displaying an error screen which gives the user the option to "retry" a load operation.

# Methods

 * *DOMElement* element() - get the element for the splash screen
 * *void* layout(width, height) - layout the splash screen with the given dimensions
 * *void* setAnimate(flag) - enable or disable animations (including any movement involved in loading).
 * *void* start() - start loading
 * *void* showError() - show a loading failed screen

# Events

This emits the following event:

 * reload() - the user would like to make another attempt to load the graph.
