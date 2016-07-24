function Route(app) {
	app.get("/", function(req,res,next) {
		res.send("Hello this is root");
	})
}
module.exports = Route;