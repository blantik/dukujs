module.exports = exports = function (app) {
	var fs = require('fs');
	if (fs.existsSync('./App/config/route.json')) {
		var mode = process.env.NODE_ENV || 'dev';
		var config = require('../App/config/route.json')[mode];
		var directory = "../App/handler/";
		config.forEach(function(doc) {
			if (fs.existsSync("./App/handler/" + doc + "/index.js")) {
				require(directory + doc + "/")(app);
			}
			else {
				console.error("Route " + doc + " Not Found");
			}
		});
	}
	else {
		var doc = {
			title : "Missing route config",
			desc : "Please put config with named route.json on the directory /App/config/",
			statusCode : 500
		}
		res.render('error/error', doc);
	}
}