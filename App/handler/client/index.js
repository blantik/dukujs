module.exports = exports = function (app) {
	app.get("/client", function(req,res,next) {
		res.send("This is client :)");
	})
}