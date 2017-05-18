// Why _name?
// Just to give indicate the intended API of this object.
// In JS we can add properties to any object at will.
// We're about to use Object.freeze to stop this.
// So we could just do:
class Person {}
const x = new Person();
x.name = 'John'
Object.freeze(x);

// But this way at least we keep the list of properties in the class itself


class Person {
	constructor(name) {
	   this.name = name;
	}
}

class Employee extends Person {
	constructor(name, employerName) {
	   super(name);
	   this.employerName = employerName;
	}
}

const j = new Employee('John', 'The Guardian');
Object.freeze(j);
j.name = 'Fred';




class Coordinate {
	constructor(x, y) {
	   this.x = x;
   	   this.y = y;
	}
}

class Box {
	constructor(position) {
		this.position = position;
	}
}

const b = new ColourfulBox(new Coordinat)