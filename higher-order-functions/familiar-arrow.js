fetch('http://ip.jsontest.com/')
	.then(response => response.text())
	.then(text => { console.log(text) });

document.addEventListener('click', event => {
	if (event.target.tagName === 'P') {
  	event.target.style.color = 'blue';
  }
});

const surprise = () => { alert('surprise!') };
setTimeout(1000, surprise);
