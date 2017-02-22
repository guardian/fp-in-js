fetch('http://ip.jsontest.com/')
	.then((response) => response.text())
	.then((text) => { console.log(text) });

fs.unlink('/tmp/hello', (err) => {
  if (err) throw err;
  console.log('successfully deleted /tmp/hello');
});

const surprise = () => { alert(‘surprise!’) };
setTimeout(1000, surprise);