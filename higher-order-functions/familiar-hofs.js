fetch('http://ip.jsontest.com/')
	.then(function(response) {
		return response.text();
	})
	.then(function(text) {
		console.log(text);
	});

document.addEventListener('click', function(event) {
	if (event.target.tagName === 'P') {
  	event.target.style.color = 'blue';
  }
});

function surprise {
	alert('surprise!')
};
setTimeout(1000, surprise);
