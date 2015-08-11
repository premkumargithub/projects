'use strict';

var defaults = require('./defaults');

var env = process.env.NODE_ENV || 'development';

var overrides = require('./' + env);

for (var key in overrides) {
    if (overrides.hasOwnProperty(key)) {
        defaults[key] = overrides[key];
    }
}

//console.log('Active config =>');
//console.dir(defaults);

module.exports = defaults;
