

//


var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Hapi = require('hapi'),
    NRP = require('node-redis-pubsub') ;
    
    var paypalMailer = require('./mailer/paypal-mailer') ;
    


var Artist = mongoose.model('Artist') ;


var events = new NRP(config.redis) ;
console.log(config);


//
// paypalMailer( { email: "a.gewessler@diamonddogs.cc", name: "ohneworte" } ) ;

Artist.find({
    state: {
        $in: ['active', 'pending'],
    },
    $or: [ { paypal_verified: false }, 
           { paypal_email: { $exists: false } }
         ]

}).exec( function(err, artists) {

     artists.map( function(artist) {
         paypalMailer( artist ) ;
// //        console.log(artist.email + " - " + artist.state + " - " + artist.paypal_verified + " - " + artist.paypal_email + " - " + artist.paypal_firstname + " - " + artist.paypal_lastname ) ;
     }) ;
    
    console.log(artists.length);
}) ;



//*/




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
