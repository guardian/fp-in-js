var arr = [42, function() { return 42; }];

var obj = {key: 42, func: function() { return 42; }}

var x = function() { return 42; };

var y = function() { return function() { return 42} };

42 + (function() { return 42; })()
//=> 84

function weirdAdd(n, f) { return n + f() }
weirdAdd(42, function() { return 42 });
//=> 84