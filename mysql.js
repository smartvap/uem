var mysql = require('mysql');
var pool = mysql.createPool({
	host : '10.19.240.13',
	user : 'root',
	password : 'root',
	database : 'test',
	port : 3306
});
var query = function(sql, callback) { // SELECT clause
	pool.getConnection(function(err, conn) {
		if(err) {
			callback(err, null, null);
		} else {
			conn.query(sql, function(qerr, vals, fields) {
				conn.release();
				callback(qerr, vals, fields);
			});
		}
	});
};
var execute = function(sql, data, callback) { // INSERT or UPDATE clause
	pool.getConnection(function(err, conn) {
		if(err) {
			callback(err, null, null);
		} else {
			conn.query(sql, data, function(qerr, vals, fields) {
				conn.release();
				callback(qerr, vals, fields);
			});
		}
	});
};
module.exports = execute;
