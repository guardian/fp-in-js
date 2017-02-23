var numbers = [1, 4, 9];
var roots = [];

for (var i=0; i < numbers.length; i++) {
  roots.push(Math.sqrt(numbers[i]));
}

var doubledRoots = [];
for (var i=0; i < roots.length; i++) {
  doubledRoots.push(roots[i] * 2);
}

// Rewrite using the .map() method on Array.
// (Ideally without storing any intermediate results in variables)

// SYNTAX of .map()
// var new_array = arr.map(callback[, thisArg])

// PARAMETERS
// callback: Function that produces an element of the new Array, taking three arguments:
// thisArg: Optional. Value to use as this when executing callback.

// PARAMETERS PASSED TO callback
// currentValue: The current element being processed in the array.
// index: The index of the current element being processed in the array.
// array: The array map was called upon.

// RETURN VALUE
// A new array with each element being the result of the callback function.