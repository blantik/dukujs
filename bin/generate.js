#!/usr/bin/env node

var folder = process.argv[2];
var fs = require('fs-extra');
var exec = require('child_process').exec,
	cmd;
if (process.argv.length < 3) {
	folder = '.';
}
if (fs.existsSync(folder) && folder != ".") {
	return console.log(folder + " Already Exists");
}
fs.copy(__dirname + '/../', folder, function(err) {
	if (err) {
		return console.log(err);
	}
	console.log("DUKU HAS BEEN INSTALLED WITH FOLDER " + folder);
})