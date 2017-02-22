var numbers = [1, 4, 9];
var roots = [];

for (var i=0; i < numbers.length; i++) {
  	roots.push(Math.sqrt(numbers[i]));
}

console.log(roots);

var doubledRoots = [];
for (var i=0; i < roots.length; i++) {
  	doubledRoots.push(roots[i] * 2);
}

console.log(doubledRoots);