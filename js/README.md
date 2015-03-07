# graphalicious.js

This will provide a JavaScript implementation of Graphalicious graphs.

# Datasource

A **datasource** provides data for the graph to draw.

### Tickets

A **ticket** represents a query on the datasource. An object is a ticket if it implements a `cancel()` function. This function terminates the query without getting a result back.

### Values

A **value** represents an element in the graph. In graphalicious.js, values are stored as arrays of numbers. Normally, a value will contain a single number. However, values can contain any amount of numbers. Empty values represent gaps in the graph and multi-numbered values represent vertically stacked entries.

### The interface

Any object is a datasource if it implements two specific functions:

    count(callback)

This function asynchrounously finds the total number of values in the graph. It returns a ticket for the request. The callback is called as `callback(err, count)`. The `err` argument will be `null` if no error was encountered. The `count` argument will be `null` in the case of an error or a number otherwise.

    query(start, end, callback)

This function asynchronously downloads a range of values to show in the graph. The values will range from the index `start` (inclusive) to `end` (exclusive). The callback is called as `callback(err, values)`. The `err` argument is `null` in the normal case. The `values` argument is a list of values (or `null` in the case of an error.)