// process.env.NODE_ENV = 'legacy' ;

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    Hapi = require('hapi'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp( config.redis ) ;

console.log(config) ;

var transform = require('stream-transform') ;

var Artist = mongoose.model('Artist') ;
var Song = mongoose.model('Song') ;
var ChartEntry = mongoose.model('ChartEntry') ;
var Vote = mongoose.model('Vote') ;






var cc = {} ;

function rnd (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}


var a = [] ;

// Contest.findOne({_id: '5391bc6069758716a25bb4a2' }).exec( function(err, contest) {
//     Song.find({ contest: { $exists: 0 }, youtubeUrl: { $exists: 1 } }).populate('artist').exec( function(err, res) {
//         res.map( function(el, i) {
//             if( a.indexOf( el.artist._id) >= 0 ) {
//                 return ;
//             }
//             
//             el.contest = contest ;
//             a.push( el.artist._id) ;
//             el.save( function(err, res) {
//                 
//             }) ;
//         }) ;
//     }) ;
// })


var cc = {
    platforms: ['android', 'ios', 'desktop'],
    types: ['twitter', 'facebook']
} ;

function subtractNDays(date, n) {
    date = new Date(date);
    date.setDate(date.getDate() - n);
    return date;
}



var contestId = '5391bc6069758716a25bb4a2' ;

//========================================
// CREATE DUMMY > NP VOTES /// 
//========================================

/* */
var currentPhase = 'globalfinalsQualification' ;

ChartEntry.find( { contest: contestId, phase: currentPhase }).populate('song artist').exec( function(err, res) {
    Artist.find( { state: 'active' } ).select('_id country slug name').exec( function(err, artists) {

        var alength = artists.length - 1 ;
        var slength = res.length - 1 ;
        
        res.forEach( function(chartEntry) {
            if( !chartEntry.song ) return ;
                
            var song = chartEntry.song ;
            var artist = chartEntry.artist ;
            var voteCount = rnd(1,100) ;
            
            console.log("----------------------------------------------------------");
            console.log("creating " + voteCount + " votes for song " + song.slug );
            
            var create = [] ;
            _.times(voteCount, function(n) {
                var platform =  cc.platforms[ rnd(0,2)] ;
                var type = cc.types[ rnd(0,1) ] ;
                var voter = artists[ rnd(0, alength) ] ;
                var day = subtractNDays( new Date(), n) ;
                
                console.log("- ["+day+"]" + platform + " | " + type + " | " + voter.name );
                
                var payload = {
                    type: type,
                    platform: platform,
                    status: 'processed',
                    artist: artist._id,
                    song: song._id,
                    phase: currentPhase,
                    voter_artist: voter,
                    day: day
                } ;
                
                create.push(payload) ;
            }) ;

            Vote.create(create, function(err, res) {
                console.log(err) ;
            }) ;
        }) ;
    }) ;
}) ;

/*
// CREATE ONE RANDOM VOTE //


// Song.find({contest: contestId, state: 'active', youtubeUrl: { $exists: true }} ).populate('artist').exec( function(err, res) {
//     Artist.find({state: 'active' } ).select('_id country slug name').exec( function(err, artists) {
//
//         var alength = artists.length - 1 ;
//         var slength = res.length - 1 ;
//
//         var song = res[ rnd(0,slength) ] ;
//
//         console.log("----------------------------------------------------------");
//         console.log("creating random vote for song " + song.slug );
//
//         var create = [] ;
//
//         var platform    = cc.platforms[ rnd(0,2)] ;
//         var type        = cc.types[ rnd(0,1) ] ;
//         var voter       = artists[ rnd(0, alength) ] ;
//         var day         = subtractNDays( new Date(), 1) ;
//
//
//         var payload = {
//             type: type,
//             platform: platform,
//             status: 'processed',
//             artist: song.artist._id,
//             phase: 'np',
//             song: song._id,
//             voter_artist: voter,
//             day: day
//         } ;
//
//         create.push(payload) ;
//
//         Vote.create(create, function(err, res) {
//             console.log(err) ;
//         }) ;
//
//     }) ;
// }) ;
//
//
//

/*
//========================================
// CREATE DUMMY NP VOTES /// 
//========================================


Song.find({contest: contestId, state: 'active', youtubeUrl: { $exists: true }} ).populate('artist').exec( function(err, res) {
    Artist.find({state: 'active' } ).select('_id country slug name').exec( function(err, artists) {

        var alength = artists.length - 1 ;
        var slength = res.length - 1 ;
        
        res.forEach( function(song) {
            var voteCount = rnd(1,50) ;
            
            console.log("----------------------------------------------------------");
            console.log("creating " + voteCount + " votes for song " + song.slug );
            
            var create = [] ;
            _.times(voteCount, function(n) {
                var platform =  cc.platforms[ rnd(0,2)] ;
                var type = cc.types[ rnd(0,1) ] ;
                var voter = artists[ rnd(0, alength) ] ;
                var day = subtractNDays( new Date(), n) ;
                
                console.log("- ["+day+"]" + platform + " | " + type + " | " + voter.name );
                
                var payload = {
                    type: type,
                    platform: platform,
                    status: 'processed',
                    artist: song.artist._id,
                    phase: 'np',
                    song: song._id,
                    voter_artist: voter,
                    day: day
                } ;
                
                create.push(payload) ;
            }) ;
            

            Vote.create(create, function(err, res) {
                console.log(err) ;
                unagi.enqueue('charts:update', { contest: '5391bc6069758716a25bb4a2', phase: 'np' }) ;
            }) ;
        }) ;
    }) ;
}) ;
/*
*/


//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////
//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////
//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////
//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////
//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////
//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////
//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////
//// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD///////////////////////////

// 
// // 
// Song.find({ country: { $exists: false } } ).populate('artist', '_id country').exec( function(err, res) {
//     console.log(res);
//     console.log(err);
//     res.map( function(el, i ) {
//         console.log(el.country + " - " + el.artist.country);
//         el.country = el.artist.country ;
//         el.save( function(err, buh) {
//             if( err ) {
//                 console.log("ERR");
//                 console.log(err);
//                 return ;
//             }
//             console.log("DONE");
//         }) ;
//     }) ;
// }) ;
// // 

// var ccc = {} ;
// ChartEntry.find({contest: '53a43e4bdf9df79258d92a38', phase: 'globalfinalsBest16' }).populate('artist').sort('-votes').exec( function(err, res) {
//     console.log(res.length);
//     res.map( function(el, i) {
//         console.log( el.artist.name + " - " + (i+1) ) ;
//         el.pos = i+1 ;
//
//         ccc[el.country] = ccc[el.country] || 0 ;
//         ccc[el.country] += 1 ;
//         el.nPos = cc[el.country] ;
//
//         el.save(function(err, res) {
//             console.log(err);
//         }) ;
//     }) ;
// }) ;



// // 
// 
// // var fs = require('fs') ;
// //
// // var csv = require('fast-csv') ;
// //
// // var stream = fs.createReadStream("./_legacy/votes.csv");
// // var request = require('request') ;
// //
// //
// // var csvStream = csv({delimiter:';'})
// //  .on("record", function(data){
// //      var userId = data[0].trim() ;
// //      var votes = parseInt(data[1].trim()) ;
// //      var title = data[2].trim() ;
// //      var youtubeUrl = data[3].trim() ;
// //
// //      Artist.findOne({"legacy.id": userId } ).exec( function(err, artist) {
// //          if( !artist ) return ;
// //          var artistId = artist._id ;
// //
// //          Song.findOne({artist: artistId, youtubeUrl: youtubeUrl }).exec( function(err, song) {
// //              var songId = song._id ;
// //              ChartEntry.findOne( { phase: 'finals', artist: artistId, song: songId } ).exec( function(err, chartentry) {
// //                  if( !chartentry )return ;
// //                  chartentry.votes = votes ;
// //                  chartentry.save( function(err, res) {
// //                       console.log(err);
// //                       console.log(res);
// //                   }) ;
// //              }) ;
// //
// //          }) ;
// //
// //      }) ;
// //
// //  })
//  .on("end", function(){
//      console.log("done");
//  });
//
// stream.pipe(csvStream);
