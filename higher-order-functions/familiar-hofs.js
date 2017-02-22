fetch('http://ip.jsontest.com/')
	.then(function(response) {
		return response.text();
	})
	.then(function(text) {
		console.log(text);
	});

fs.unlink('/tmp/hello', function(err) {
  if (err) throw err;
  console.log('successfully deleted /tmp/hello');
});

var surprise = function() { alert(‘surprise!’) };
setTimeout(1000, surprise);
