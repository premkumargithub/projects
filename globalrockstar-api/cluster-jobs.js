var config = require('./config') ;
var cluster = require('cluster') ;
var models = require('./models') ;
var npr     = require('node-redis-pubsub') ;
var unagi   = new npr( config.redis ) ;

var clusterSize = require('os').cpus().length ;

if( cluster.isMaster ) {
    for( var i = 0 ; i < clusterSize; i++ ) {
        cluster.fork() ;
    }
} else {
    require('./events') ;
}
