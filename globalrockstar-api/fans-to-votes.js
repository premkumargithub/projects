var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    Hapi = require('hapi'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp( config.redis ) ;

console.log(config) ;


var Artist = mongoose.model('Artist') ;
var Song = mongoose.model('Song') ;
var ChartEntry = mongoose.model('ChartEntry') ;
var Vote = mongoose.model('Vote') ;

var contestId = '5391bc6069758716a25bb4a2' ;

function subtractNDays(date, n) {
    date = new Date(date);
    date.setDate(date.getDate() - n);
    return date;
}


var voter = mongoose.Types.ObjectId();
var platform =  'desktop' ;
var type     = 'bonus' ;

ChartEntry.find( { /*artist: "53e3b77fc6a9b1b55e798587", */ contest: contestId, phase: 'np' } )

.populate( 'artist', '_id country fans fans_a')
.populate( 'song', '_id slug country').exec( function(err, chart_entries) {
    
    
    ChartEntry.populate(chart_entries, [
        { path: "artist.fans",  match: { state: { $in: ['active', 'pending'] } }, model: 'Fan', select: 'state slug _id'},
        { path: "artist.fans_a", match: { state: { $in: ['active', 'pending'] } }, model: 'Artist', select: 'state slug _id' } ], function(err, entries) {
    
        entries.forEach( function(entry) {
        
            if( !entry.artist || !entry.song ) {
                console.log("[err] artist or song not populated!");
                return ;
            }
            
            var fans_f_count = entry.artist.fans.length ;
            var fans_a_count = entry.artist.fans_a.length ;
            
            console.log( entry.artist.fans.map( function(el) { return el.state; } ) ) ;
            console.log( entry.artist.fans_a.map( function(el) { return el.state; } ) ) ;

            console.log( fans_f_count ) ;
            console.log( fans_a_count ) ;
            
            
<<<<<<< HEAD
            return ;
=======
            // return ;
>>>>>>> master
        
            var times = fans_f_count + fans_a_count ;
        
            var votes = [] ;

            _.times( times, function(n) {
                var day = subtractNDays( new Date(), n ) ;

                var payload = {
                    type: type,
                    platform: platform,
                    status: 'processed',
                    artist: entry.artist._id,
                    song: entry.song._id,
                    phase: 'np',
                    voter_artist: voter,
                    day: day
                } ;
            
                votes.push(payload) ;

            }) ;

            console.log("creating " + times + " bonus votes for " + entry.artist.slug );
<<<<<<< HEAD
            // Vote.create(votes, function(err, res) {
            //     console.log(err) ;
            // }) ;
=======
            Vote.create(votes, function(err, res) {
                 console.log(err) ;
            }) ;
>>>>>>> master

        }) ;
    
    }) ;

}) ;
<<<<<<< HEAD
=======


>>>>>>> master
