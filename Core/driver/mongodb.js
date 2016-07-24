function MongoDB () {
	var mode = process.env.NODE_ENV || 'dev';
	var mongoDB = require('mongodb').MongoClient;
	var fs = require('fs');
	var dbFile = '../../App/config/database.json';
	var configDB = require(dbFile);
	var config = configDB[mode] || configDB['dev'];

	this.connect = function (cb) {
		if (config.mongodb != undefined ) {
			if ( ( config.mongodb.connection.user == '' || config.mongodb.connection.user == undefined ) && ( config.mongodb.connection.pwd == '' || config.mongodb.connection.pwd == undefined) ) {
				mongoDB.connect('mongodb://'+config.mongodb.connection.host+':'+config.mongodb.connection.port+'/'+config.mongodb.connection.db , function (err , db){
					return cb(err, db);
				});
			} else {
				mongoDB.connect('mongodb://'+config.mongodb.connection.user+':'+config.mongodb.connection.pwd+'@'+config.mongodb.connection.host+':'+config.mongodb.connection.port+'/'+config.mongodb.connection.db , function (err , db){
					return cb(err, db);
				})
			}
		} else {
			return cb('connection null', null);
		}
	}

	this.collection = function(model) {
		return db.collection(model);
	}

	this.SaveData = function (model , data , callback ) {
		return db.collection(model).insert(data , callback);
	}

	this.find = function(model, where, options, callback) {
		var query = options;
		if (query == null) {
			return db.collection(model).find(where).toArray(callback);
		} else {
			var limit = options.limit || 0;
			var skip = options.skip || 0;
			var sort = options.sort || {_id : 1};
			return db.collection(model).find(where).sort(sort).skip(skip).limit(limit).toArray(callback);
		}
	}

	this.findOne = function(model, where, callback) {
		return db.collection(model).findOne(where, callback);
	}

	this.update = function(model, where, data, callback) {
		return db.collection(model).update(where, data, callback);
	}

	this.remove = function(model, where, callback) {
		return db.collection(model).remove(where, callback);
	}

	this.drop = function(model, callback) {
		return db.collection(model).drop(callback);
	}

	this.count = function (model , where , callback) {
		return db.collection(model).count(where,callback);
	}

	this.aggregate = function(model, where, group, options, callback) {
		var advanced = options;
		if (advanced != null) {
			advanced.sort = options.sort || {_id : 1};
			advanced.limit = options.limit || 0;
			advanced.skip = options.skip || 0;
		}
		return db.collection(model).aggregate([{$match : where}, {$group : group}, {$sort : advanced.sort}, {$limit : advanced.limit}, {$skip : advanced.skip}], callback);
	}
}

module.exports = MongoDB;