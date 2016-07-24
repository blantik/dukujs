module.exports = function (cb) {
	var mode = process.env.NODE_ENV || 'dev';
	var database = require('../App/config/database.json')[mode] || require('../App/config/database.json')[mode];
	if (database.driver != undefined ) {
		var driver = require('./driver/'+database.driver);
		var connection = new driver();
		connection.connect(function (err , db){
			return cb(err , db);
		});
	}
}