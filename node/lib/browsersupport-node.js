/* exported RESEnvironment */

var fs = require('fs');
RESEnvironment.localStorageTest = function() { return true; };
RESEnvironment.loadResourceAsText = function(filename, callback) {
	callback(fs.readFileSync('lib/' + filename, 'utf8'));
};

exports.RESEnvironment = RESEnvironment;
