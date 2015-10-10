# Abstract

A splash screen is a loading screen which the user sees before a graph loads.

# Methods

 * *DOMElement* element() - get the element for the splash screen
 * *void* layout(width, height) - layout the splash screen with the given dimensions
 * *void* setAnimate(flag) - enable or disable animations (including any movement involved in loading).
 * *void* start() - start loading
 * *void* showError() - show a loading failed screen

# Events

This emits the following event:

 * refresh() - the user would like to make another attempt to load the graph.
