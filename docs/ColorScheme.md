# Abstract

An instance of *ColorScheme* tells the built-in [VisualStyles](VisualStyle/VisualStyle.md) what colors to use.

# Overview & Terminology

A color is a concept which every CSS and HTML developer should know. In CSS, a color can be represented as a hex value (e.g. `#65bcd4`), a name (e.g., `white`), or an RGBA value (e.g., `rgba(255, 255, 0, 0.5)`). The same system applies to a *ColorScheme*, whose colors are represented as CSS strings.

In a [DataSource](#DataSource.md), a data point can have primary and secondary values. In a similar way, a color scheme has a primary and a secondary color. While a style can use these colors however it likes, all of the built-in styles use them as you would expect: primary colors are used to draw primary values, and secondary colors secondary values.

A color scheme is mutable, meaning that its primary and secondary colors can be updated after it is created. It is the *VisualStyle*'s job to handle this change and update itself accordingly.

# Construction

The *ColorScheme* class can be constructed as follows:

```js
var colorScheme = new window.graphalicious.ColorScheme(primary, secondary);
```

The `primary` and `secondary` arguments are CSS color strings.

# Methods

*ColorScheme* implements the following methods:

 * *string* getPrimary() - get the primary color.
 * *string* getSecondary() - get the secondary color.
 * *void* update(primary, secondary) - update the primary and secondary color.

# Events

*ColorScheme* emits the following events:

 * change - emitted when the color scheme is updated by a call to `update()`.
