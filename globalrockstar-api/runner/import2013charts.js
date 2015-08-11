// process.env.NODE_ENV = 'legacy' ;

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Hapi = require('hapi');

var Artist = mongoose.model('Artist') ;
var ChartEntry = mongoose.model('ChartEntry') ;
var Song = mongoose.model('Song') ;
var Contest = mongoose.model('Contest') ;


console.log(config);

var request = require('request') ;

// var contestId = '53a43e4bdf9df79258d92a38' ;
//
// // Song.find({state: 'active'}).select('_id artist country').populate('artist', '_id country').exec( function(err, res) {
// //     res.map( function(el) {
// //         console.log("%s - %s", el.country, el.artist.country);
// //         el.country = el.artist.country ;
// //         el.save(function(err,r) { console.log(err); }) ;
// //     }) ;
// // }) ;


var s3 = "http://grs-centralstore-01.s3.amazonaws.com/audios/" ;

var path = require('path') ;
var fs = require('fs') ;
var fs = require('graceful-fs')
var missing = [] ;

var cId = '5391bc6069758716a25bb4a2' ;

function youtubeId(text) {
    var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
    return text.replace(re, '$1') ;
}



Song.find({ /*contest: cId, */state: { $in: ['active', 'pending'] } }).select('_id title youtubeUrl').exec( function(err, res) {
    
    console.log(res.length);
    res.map( function(song) {

        var youtubeUrl = song.youtubeUrl ;
        if(!youtubeUrl)return ;


        var youId = youtubeId( youtubeUrl ) ;
        youId = youId.split("#")[0] ;
        var file = s3 + youId + ".mp3" ;
        
        request.head( file, function(err, res) {
            if( res.statusCode == 403 && missing.indexOf( youtubeUrl ) === -1 ) {
                console.log(song._id + ";" + song.title + ";" + youtubeUrl) ;
              //  console.log(youtubeUrl);
             //   console.log("-> " + youId);
          //      console.log(missing.length);
                missing.push( youtubeUrl ) ;
            }
        }) ;
    }) ;
}) ;


// Artist.find({state: 'active'}).exec( function(err, res) {
//     res.map( function(artist) {
//
//         var picture = artist.youtubeUrl ;
//         if(!picture)return ;
//
//         var ext = path.extname( picture ) ;
//         var base = path.basename( picture, ext ) ;
//
//         ['small', 'small_x2', 'large', 'big', 'profile'].map( function(size) {
//
//             var file = s3 + base + "_" + size + ext ;
//
//             request.head( file, function(err, res) {
//                 if( res.statusCode == 403 && missing.indexOf( picture ) === -1 ) {
//
//                     if (!fs.existsSync("./pics/" + picture ) && picture.indexOf('avatar') == -1 ) {
//                         console.log( s3 + picture ) ;
//                         missing.push( picture ) ;
//                         var ws = fs.createWriteStream("./pics/" + picture ) ;
//                         request( s3 + picture ).pipe(ws) ;
//                     }
//                 }
//             }) ;
//
//         }) ;
//     }) ;
// }) ;


// Song.find({state: 'active', contest: '53a43e4bdf9df79258d92a38' }).exec( function(err, res) {
//     res.map( function(song) {
//         var audiofile = song.audiofile || (song.youtube.id+".mp3") ;
//
//         request.head(+audiofile
//         console.log(audiofile);
//     }) ;
// }) ;


// var contestId = '53a43e4bdf9df79258d92a38' ;
// Contest.findById( contestId ).exec( function(err, contest) {
//
//     console.log("CONTEST: " + contest.name );
//
//
// //    var phase = "nationalChart2013" ;
// //    var phase = "finalChart2013" ;
//
//     Song.count({ "legacy.finalChart2013": { $gt: 0 }}).exec( function( err, count) {
//         var votes = count ;
//         console.log(votes);
//
//         Song.find({"legacy.finalChart2013": { $gt: 0 }}).sort("legacy.finalChart2013").populate('artist', '_id country').exec( function(err, songs) {
//
//             songs.forEach( function(song) {
//
//                 if( !song.artist ) return ;
//
//                 console.log(song.artist);
//
//                 var chart = new ChartEntry({
//                     artist: song.artist,
//                     song: song,
//                     contest: contest,
//                     phase: 'globalfinalsBest16',
//                     votes: song.legacy.views,
//                     country: song.artist.country
//                 }) ;
//                 chart.save( function(err, res) {
//                     console.log(res._id) ;
//                 }) ;
//                 votes -= 1 ;
//
//             }) ;
//         }) ;
//     }) ;
//

//
//
//
//
//
//
//
//
// }) ;
