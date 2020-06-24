var express = require('express');
var execute = require('./mysql.js');
var app = express();
app.configure(function() {
	app.use(express.bodyParser());
});
app.post('/service/uem/user_actions.do', function(req, res) {
	console.log();
	execute('INSERT INTO user_action_json(json) VALUES (?)', [ JSON
			.stringify(req.body) ], function(err, vals, fields) {
		if (err)
			console.log(err);
	});
	res.send('Success!');
});
app.listen(8080);
