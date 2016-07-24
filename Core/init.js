var server = require('./loader');
var avocado = new server();

avocado.connect(function (err , db){
	// console.log(err);
	if (err) {
		// use handler
		avocado.initDatabase();
		// avocado.initAutoLoad();
		avocado.initAvocado();
		avocado.run();
	} else {
		avocado.initDatabase();
		avocado.initAutoLoad();
		avocado.initSession();
		
		// use handler
		avocado.initAvocado();

		avocado.run();
	}
});