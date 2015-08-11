'use strict'

require('./lib/event-listener')() ;

var hapi = require('hapi'),
    config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    seaport = require('seaport'),
    ports = seaport.connect('localhost', parseInt( process.env.SEAPORT || 9090 ) );

var http = require('http');
http.globalAgent.maxSockets = 200;

var port = ports.register('gr:api', { port: config.port, title: 'API' } ) ;
var server = hapi.createServer('localhost', port, {
    cache: {
        engine: require('catbox-redis'),
        partition: 'apicache',
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.auth
    }
});

require('./routes')(server);
require('./events') ;
require('./workers/scheduled-mailer') ;

server.pack.register({
  plugin: require('good'),
  options: config.goodOptions
}, function(err) {
  server.start(function () {
    console.log('Server started at: ' + port);
  });
}) ;

module.exports = server ;

require('./workers/artist-statistics');