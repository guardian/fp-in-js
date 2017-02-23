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
// (Ideally return the final contents of doubledRoots
// without any intermediate variables)
