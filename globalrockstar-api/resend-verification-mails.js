

//


var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Hapi = require('hapi'),
    NRP = require('node-redis-pubsub') ;


var Artist = mongoose.model('Artist') ;
var Fan = mongoose.model('Fan') ;


var events = new NRP(config.redis) ;


console.log(events);

/*
Artist.find( { 
     state: 'pending'
    createdAt: { 
        $lt: new Date('2014-09-01 12:09:21.982Z'), 
        $gt: new Date('2014-09-01 00:00:21.982Z')  }
    }).exec( function(err, res) {
        res.forEach( function(artist) { 
            console.log(artist.email);
            // //        events.enqueue('artists:register:verification', artist ) ;

        })
    }) ;
}) ;
*/

/*
Fan.find( { 
    state: 'pending'
    createdAt: { 
        $lt: new Date('2014-09-01 12:09:21.982Z'), 
        $gt: new Date('2014-09-01 00:00:21.982Z')  }
    }).exec( function(err, res) {
        res.forEach( function(fan) { 
            console.log(fan.email);
            // //        events.enqueue('fans:register:verification', fan ) ;

        }) ;
    }) ;
*/
