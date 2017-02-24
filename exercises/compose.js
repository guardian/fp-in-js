const addOne = x => x + 1
const double = x => x * 2

addOne(double(3)) // 7

const doublePlusOne = compose(addOne, double);

doublePlusOne(3) // Should be 7

// EXERCISE
// Implement the function compose()
// BONUS POINT: do it in ES5 and ES6 syntax