var express = require('express'),
	app = express(),
	mode = process.env.NODE_ENV || 'dev',
	bodyParser = require('body-parser'),
	async = require('async'),
	path = require('path'),
	cookieParser = require('cookie-parser'),
	routes = require('../App/routes');
var ClientRoutes = require('../App/handler/client/');

var autoload = require('../App/config/autoload.json');
autoload = autoload[mode] || autoload['dev'];
var fs = require('fs');
var config_database;
var status_db = false;
var err_db = '';

var session = require('express-session');
var config_session = require('../App/config/session.json');
config_session = config_session[mode] || config_session['dev'];

function Avocado() {	
	this.app = app;
	this.db = null;

	this.run = function () {
		var configApp = require('../App/config/app.json')[mode] || require('../App/config/app.json')['dev'];
		app.listen(configApp.app.port ,  function() {
			console.log("Application Running On " + configApp.app.host + ":" + configApp.app.port);
		});
	}

	this.connect = function (cb) {
		if (fs.existsSync('./App/config/database.json')) {
			config_database = require('../App/config/database.json');
			config_database = config_database[mode];
			if (config_database) {
				var database = require('./database');
				database(function (err , db){
					this.db = db;
					if (err) {
						status_db = false;
						err_db = err;
					} else {
						status_db = true;
					}
					return cb(err , db);
				});
			} else {
				status_db = false;
				return cb('Database Config Not Found', null)
			}
		} else {
			status_db = false;
			return cb('Database Config Not Found', null)
		}
	}

	this.initDatabase = function() {
		app.use(this.database);
	}

	this.database = function(req, res, next) {
		if (status_db == true) {
			var driver = require('./driver/' + config_database.driver);
			req['db'] = new driver(this.db);			
			next();
		}
		else {
			var target = path.normalize(__dirname+'/..');
			app.set('views', path.join(target, './App/views'));
			app.set('view engine', 'pug');

			var doc = {
				title : "Missing database config",
				desc : "Please put config with named database.json on the directory /App/config/",
				statusCode : 500
			}
			res.render('error/error', doc);
		}
	}

	// config session , passport , redis 
	this.initSession = function () {
		if (config_session.redis != undefined ) {
			var	redisStore = require('connect-redis')(session);
			var redis = require('redis').createClient();
			app.use(session({
				secret : config_session.session.secret,
				store : new redisStore({
					host : config_session.redis.host.toString(),
					port : config_session.redis.port,
					saveUninitialized : config_session.session.saveUninitialized,
					resave : config_session.session.resave,
					client : redis,
					db : config_session.redis.db
				}),
				resave : config_session.session.resave
			}));
		} else if (config_session.mongodb != undefined) {
			var MongoStore = require('connect-mongo/es5')(session);
			config_database = require('../App/config/database.json');
			config_database = config_database[mode];
			var url = "";
			var db_session = config_session.mongodb.db;
			if ( (config_session.mongodb.user == '' || config_session.mongodb.user == undefined ) && (config_session.mongodb.password == '' || config_session.mongodb.password == undefined )) {
				url = 'mongodb://'+config_session.mongodb.host+':' + config_session.mongodb.port + '/'+db_session;
			} else {
				url = 'mongodb://'+config_session.mongodb.user+':'+config_session.mongodb.password+'@'+config_session.mongodb.host+':' + config_session.mongodb.port + '/'+db_session;
			}
			app.use(session({
				secret: config_session.session.secret,
				// saveUninitialized : config_session.session.saveUninitialized,
				// resave : config_session.session.resave,
				// cookie: { maxAge: 24 * 60 * 60  },
				store: new MongoStore({
					url: url
				})
			}));
		} else {
			app.use(session({
				secret : config_session.session.secret,
				saveUninitialized : config_session.session.saveUninitialized,
				resave : config_session.session.resave
			}));
		}

		if (config_session.passport != undefined ) {
			if (config_session.passport.auth == true ) {
				var authPassport = require('../App/plugins/passport');
				var initPassport = new authPassport();
				var passport = initPassport.getPassport();
				app.use(passport.initialize());
				app.use(passport.session());
				initPassport.passportInit();
			}
		}
	}

	this.initAutoLoad = function() {
		app.use(this.autoload);
	}

	this.initAvocado = function () {
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: false }));
		// ## SETTING VIEW ENGINE & CSS PRECOMPILER
		var target = path.normalize(__dirname+'/..');
		app.set('views', path.join(target, './App/views'));
		app.set('view engine', 'pug');
		app.use(require('stylus').middleware(path.join(target, './App/public')));
		app.use(express.static(path.join(target, './App/public')));
		app.use(cookieParser('sessionavocadotetttt'));
		app.use(function (req , res , next ) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With");
			// res.header("Access-Control-Allow-Credentials", "true");
			next();
		})
		if (status_db) {
			var client = express();
			client.set('views', path.join(target, './App/views'));
			client.set('view engine', 'pug');
			client.use(require('stylus').middleware(path.join(target, './App/public')));
			// BOWER COMPONENTS
			app.use("/bower", express.static(path.join(__dirname, '../bower_components')));			

			app.use(client);
			ClientRoutes(client);

			// SETTING ERROR MIDLEWARE
			var ErrorHandler = require('./error').errorHandler;

			routes(app);
			app.use(ErrorHandler);
		} else {
			app.all('*', function (req , res , next) {
				return res.render('error/error');
			});
		}
	}

	this.autoload = function(req , res , next ) {
		var plugins = autoload.plugins || null;
		var features = autoload.features || null;
		req['plugin'] = {};
		if (plugins != null) {
			plugins.forEach(function (plugin) {
				var module = require('../App/plugins/' + plugin);
				req['plugin'][plugin] = new module;
			});
		}

		if (features != null) {
			features.forEach(function (feature) {
				var module = require('../App/features/' + feature);
				req[feature] = new module;
			});
		}
		next();
	}
}

module.exports = Avocado;