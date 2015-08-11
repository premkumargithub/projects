var Hoek = require('hoek');

require('./lib/event-listener')() ;

var internals = {};

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    Hapi = require('hapi');

var http = require('http');
http.globalAgent.maxSockets = 200;

require('./events') ;
require('./workers/artist-statistics');
require('./workers/scheduled-mailer') ;

exports.register = function (plugin, options, next) {
    require('./routes')(plugin.select('api')) ;
    return next();
};

exports.register.attributes = {
    name: 'gr-rest-api',
    version: '1.0.0'
};
