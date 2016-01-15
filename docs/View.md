# Abstract

The *View* can present a [ContentView](ContentView/ContentView.md) and allow it to scroll.

# Overview & Terminology

A *View* is essentially a glorified [scroll view](https://github.com/unixpickle/scroller.js). It automatically passes its size and animation state down to a *ContentView*, and reflects scrolling state changes from the same *ContentView*. The *View* provides the DOM element that you, the user, should add to your webpage.

# Methods

*View* implements the following methods:

 * *DOMElement* element() - get the root element of the *View*. You should add this to your webpage to show the *View*.
 * *void* layout(width, height) - update the size of the DOM element and notify the *ContentView* of the change.
 * *boolean* getAnimate() - get whether or not animations are enabled for the *ContentView*.
 * *void* setAnimate(flag) - set whether or not animations are enabled for the *ContentView*. If the *View* currently has no *ContentView*, this flag will be set on any *ContentView* which is presented in this *View*. This flag persists through any number of *setContentView()* calls.
 * *ContentView* getContentView() - get the current *ContentView* being presented in this *View*. This may be `null`.
 * *void* setContentView(cv) - change the *ContentView* being presented in this *View*. The old *ContentView*, if there was one, will be removed from the *View*. While a *ContentView* is showing in the *View*, the *View* will add a *Harmonizer* to the *ContentView*'s root harmonizer. This allows the *ContentView* to cluster draws that occur because of scrolling and pointer events.
