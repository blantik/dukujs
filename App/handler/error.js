exports.errorHandler = function (err, req, res, next){
	var mode = process.env.NODE_ENV || 'dev';
	var shortid = require('shortid');
	var now = new Date();
	var tanggal = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

	var dataError = {
		_id : shortid.generate(),
		url : req.originalUrl,
		message : err.message,
		date : tanggal,
		type : "error"
	};

	if (err.message != "SORRY THIS PAGE NOT FOUND !!!") {
		req.db.SaveData("logs", dataError, function(errs, hasil) {
			if (err) console.error("Error");
			console.error("Insert Error Data", err.message);
		})
	}
	
	if (mode == 'dev') {
		return res.render('error',{
			message: err.message,
			error: err
		})
	} else {
		return res.render('error',{
			message: err.message,
			error: err
		});
	}
}