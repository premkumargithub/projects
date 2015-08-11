/**
 * @module Routes:index
 *
 * @description Initialize all the routes functions found in routes/ directory
 *
 * @requires module:path
 * @requires module:fs
 */
var path = require('path'),
    fs = require('fs');

var routes = function (server) {
    fs.readdirSync(__dirname).filter(function (file) {
        return path.join(__dirname, file) != __filename;
    }).forEach(function (file) {
        require('./' + path.basename(file))(server);
    });
};

module.exports = routes;
