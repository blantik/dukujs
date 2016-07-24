
module.exports = exports = function (app) {
	// Handler Server
	app.get("/", function(req,res,next) {
		res.send("Hello, this is duku core");
	})
}