var passport = require ('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require ('bcrypt-nodejs');
var mode = process.env.NODE_ENV || 'dev';
var _ = require('underscore');
var fs = require('fs');
if (fs.existsSync('./App/config/database.json')) {
	var database = require('../config/database.json')[mode] || require('../config/database.json')[mode];
	var driver = require('../../Core/driver/'+database.driver);
	var connection = new driver();
}

function Passport () {

	this.getPassport = function () {
		return passport;
	}

	this.Login = function (req , res , next ) {
		passport.authenticate ( 'local', function (err , user, info) {
			if (err) {
				return res.json({ status : 'gagal', pesan : info.message});
			} else if (!user) {
				return res.json({ status : 'gagal', pesan : info.message});
			} else {
				req.login(user, function (err) {
					if (err) {
						return res.json({ status : 'gagal', pesan : info.message});
					} else {
						return res.json({ status : 'sukses', pesan : info.message});
					}
				});
			}
		})(req,res,next);
	}

	this.passportInit = function (req , res , next ) {
		// ## pake strategy login lokal
		passport.use(new LocalStrategy(function (username, password, done){
			// console.log(connection);
			connection.find('users', { _id : username }, {} , function (err , data){
				// console.log(data)
				if (err) return done(null, false, { message : 'User Tidak Terdaftar, Silahkan Register !!!'});
				// kalau data ngga ketemu / null berarti user tidak terdaftar
				if(data == null || data.length == 0){
					return done(null, false, {
						message: 'User Tidak Terdaftar, Silahkan Register !!!'
					});
				} else {
					var user = data[0];
					if ( !bcrypt.compareSync( password , user.password ) ) {
					// console.log('password tidak cocok !!!');
						return done(null, false, {
							message: 'Password Invalid !!!'
						});
					} else if (user.status == 0) {
					// kalau status usernya ngga aktif / disabled
						return done(null, false, {
							message: 'You are not allowed to login, please contact your administrator'
						});
					} else {
						return done(null, user, {
							message: 'Login berhasil ! '
						});
					}
				}
			});
		}));

		passport.serializeUser(function (user , done){
			done(null,user);
		});

		// ## Deserialize
		passport.deserializeUser(function (user , done){
			done(null,user);
		});
	}

	this.ProtectMenu = function (req , res , next ) {
		if (req.isAuthenticated()) {
			var userLogin = req.user;
			var url = req.url;
			req.db.find('users', { _id : userLogin._id } , {} , function (err , User){
				req.plugin.menu.AmbilIDMenu(req , User[0].role_group , function (err , ListAccess){
					req.plugin.menu.list_idMenu(req , ListAccess , function (err , Menu){
						var cek = _.findWhere(Menu,{menu_uri : url });
						if (cek != undefined) {
							return next();
						} else {
							req.logger.error('SORRY YOU CAN NOT ACCESS THIS PAGE  !!!',403, function (err) {
								return res.render('error', {
									message : err.message,
									error : err
								});
							});
						}
					});
				});
			});
		} else {
			return res.redirect('/');
		}
	}

	this.isAuthenticated = function (req , res , next) {
		// do any checks you want to in here
		// CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
		// you can do this however you want with whatever variables you set up
		if (req.isAuthenticated()) {
			// req.session.cookie.expires = false;
			// res.cookie('cookiename', 'undefinedikumenyakitkan', { maxAge: max, httpOnly: true });
			// console.log(req.session);
			return next();
		} else {
			// IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
			res.redirect('/user/login');
		}

	}
}
module.exports = Passport;