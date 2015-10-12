# Abstract

A *SplashScreen* is used by a [YLabelContentView](Y_LABEL_CONTENT_VIEW.md) to visually indicate that the graph is loading. The *SplashScreen* is also responsible for displaying an error screen which gives the user the option to "retry" a load operation.

# Overview & Terminology

A *SplashScreen* most likely includes some sort of loading animation. It would be an utter waste of resources if this animation were constantly being rendered and maintained in the background, even while the *SplashScreen* was invisible or permanently removed from the DOM. For this reason, *SplashScreen*s include a mechanism for enabling and disabling such animations. When animations are disabled, a *SplashScreen* should not hold any resources which cannot be garbage collected. In other words, a *SplashScreen* should not be referenced by any "global" objects while its animations are disabled.

# Methods

 * *DOMElement* element() - get the *SplashScreen*'s root DOM element. This element will automatically be sized by the *SplashScreen*. However, it will be positioned by the parent.
 * *void* layout(width, height) - layout the splash screen with the given dimensions. This is called whenever the *SplashScreen* should be resized.
 * *void* setAnimate(flag) - enable or disable animations. While animations are disabled, the *SplashScreen* should not consume any resources which cannot be garbage collected.
 * *void* showLoading() - show the loading screen.
 * *void* showError() - show the error screen. This screen must include a way for the user to "retry" the load.

# Events

A *SplashScreen* emits the following event:

 * retry() - the user would like to make another attempt to load the graph.
