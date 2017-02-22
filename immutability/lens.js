const person = {
	name: 'John',
	address: {
		number: 123,
		street: 'Fake Street'
	}
};

const streetLens = R.lensPath(['address', 'street']);
R.set(streetLens, 'Main Street', person);

// => {
//   name: 'John',
//	 address: {
//		number: 123,
//		street: 'Main Street'
//	 }
// }
