
module.exports = exports = function (app) {
	// Handler Server
	var ErrorHandler = require('./handler/error').errorHandler;	
	app.get("/", function(req,res,next) {
		res.send("Hello, this is duku core", a);
	})

	app.use(ErrorHandler);
}