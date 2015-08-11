/**
 * @module Models:index
 *
 * @description Load all the modules in moduels/ directory
 *
 * @requires module:fs
 * @requires module:path
 */
var fs = require('fs'),
    path = require('path') ;

fs.readdirSync(__dirname).forEach(function (file) {
    if (/(.*)\.(js$|coffee$)/.test(file)) {
        require(__dirname + '/' + file);
    }
});
