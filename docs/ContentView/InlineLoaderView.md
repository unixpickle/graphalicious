# Abstract

An *InlineLoaderView* is an isolated loading animation which a [ContentView](ContentView.md) may use to indicate that more content is being loaded. An *InlineLoaderView* is also responsible for showing a "retry" button in cases where a load operation fails.

# Animations & Disposal

The `setAnimate()` method of an *InlineLoaderView* works just like the equivalent method on a [SplashScreen](SplashScreen.md). Essentially, it is used to prevent rendering of invisible animations and to avoid global references to unused *InlineLoaderView*s.

# Methods

 * *DOMElement* element() - get the view's root DOM element. This element will automatically be sized by the *InlineLoaderView*. However, it will be positioned by the parent.
 * *void* layout(width, height) - layout the view so that it fits inside the given dimensions. This is called whenever the *InlineLoaderView* is resized.
 * *void* setAnimate(flag) - enable or disable animations. While animations are disabled, the view should not consume any resources which cannot be garbage collected.
 * *void* showLoading() - show the loading animation.
 * *void* showError() - show the "retry" button which accompanies an error.

# Events

 * retry() - the user would like to make another attempt to load the missing content.
