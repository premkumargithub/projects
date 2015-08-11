// process.env.NODE_ENV = 'legacy' ;

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    ytdl = require('ytdl-core'),
    Hapi = require('hapi');

var Artist = mongoose.model('Artist') ;
var ChartEntry = mongoose.model('ChartEntry') ;
var Song = mongoose.model('Song') ;
var Contest = mongoose.model('Contest') ;



var post_nominate_songs = [] ;

var emptyVoteTypes = {
    facebook:0,
    twitter: 0,
    desktop: 0,
    ios: 0,
    android: 0,
    purchase:0,
    dummy: 0,
    bonus: 0,
    serie: 0,
    fan: 0
} ;
// var manualIds = [ '53b298f78c615ae451ce8c2a','53b298f98c615ae451ce8e14','53b298fa8c615ae451ce8e99','53b298fa8c615ae451ce8eb1','53b298fa8c615ae451ce8f46','53b298fa8c615ae451ce8f2f','53b298fb8c615ae451ce8fc4','53b298fb8c615ae451ce8fc9','53b298fb8c615ae451ce8f5e','53b298fc8c615ae451ce91f9','53b298fc8c615ae451ce9175','53b298fe8c615ae451ce944c','53b298fe8c615ae451ce93d2','53b298fe8c615ae451ce9442','53b298fe8c615ae451ce9475','53b298ff8c615ae451ce955c','53b299018c615ae451ce9788','53b299018c615ae451ce97e1','53b299038c615ae451ce98ac','53b299028c615ae451ce988b','53b299028c615ae451ce9865','53b299038c615ae451ce98d4','53b299028c615ae451ce9857' ] ;


var manualIds = [ '53b299038c615ae451ce98ed', '53b299048c615ae451ce9995', '53b298f98c615ae451ce8d8a', '53b298f98c615ae451ce8dfe',
'53b298f58c615ae451ce8a6f', '53b298f78c615ae451ce8bcc', '53b298fa8c615ae451ce8e96', '53b298f88c615ae451ce8ccc', '53b298f58c615ae451ce8a81',
 '53b298f88c615ae451ce8c80', '53b298f98c615ae451ce8db5', '53b298f98c615ae451ce8db8', '53b298f98c615ae451ce8da0', '53b298fa8c615ae451ce8ee0', 
 '53b298fa8c615ae451ce8f14', '53b298fb8c615ae451ce901b', '53b298fb8c615ae451ce8fc6', '53e8f1a10e3fa70000f0ff02', '53b298fc8c615ae451ce9111', 
 '53b298fd8c615ae451ce922a', '53b298fb8c615ae451ce90a3', '53b298fc8c615ae451ce9152', '53b298fb8c615ae451ce909c', '53b298fc8c615ae451ce91dd', 
 '53b298fd8c615ae451ce9254', '53bbc874891bbb254371fa84', '53b298ff8c615ae451ce9541', '53b298ff8c615ae451ce9597', '53b298fe8c615ae451ce946e', 
 '53b299038c615ae451ce9964', '53b299018c615ae451ce97a3', '53d26322022eb0974113f8c8' ] ;


// 
// 
// 
manualIds.forEach( function(songId) {
    Song.findOne({_id: songId}).populate('artist').exec( function(err, s) {
        if( !s ) {
            console.log("000 SONG NOT FOUND") ;
            return ;
        }
    })
    .populate( 'artist', '_id state genres_own country genres_music name slug')
    .exec( function(err, songs) {

        console.log("%s %s", s.title, s.contest) ;


        //
        s.contest = "5391bc6069758716a25bb4a2" ;
        s.postNominated3 = true ;
        var artist = s.artist ;
        if( artist.genres_own == null || artist.genres_own.length == 0 ) artist.genres_own = ['Pop'] ;
        if( artist.genres_music == null || artist.genres_music.length == 0 ) artist.genres_music = ['Pop'] ;
        if( artist.country == null || artist.country == '' ) artist.country = 'US' ;

        s.country = artist.country || 'US' ;

        artist.save( function(err, updatedArtist) {
            if( err ) {
                console.log('artist-save err: ');
                console.log(err);
            }
        }) ;

        s.save( function(err, updatedSong) {
            if( err ) {
                console.log("ERR: ") ;
                console.log(err) ;
                return ;
            }

            ChartEntry.create({
                artist: s.artist,
                song: s,
                phase: 'np',
                votes: 0,
                pos: 0,
                nPos: 0,
                voteTypes: emptyVoteTypes,
                contest: s.contest,
                country: s.artist.country || "US",
                postNominated3: true
            }, console.log) ;

        }) ;


    }) ;
}) ;

//
//
// Artist.find({
//     state: { $in: ['active', 'pending' ] }
// }).exec( function(err, artists) {
//
//     var artist_length = artists.length ;
//     var counter = 0 ;
//     var artist_ids = [] ;
//     artists.forEach( function(artist) {
//
//         Song.count({ contest: '5391bc6069758716a25bb4a2', artist: artist._id }, function(err, count) {
//
//             if( count == 0 ) {
//                 artist_ids.push( artist._id ) ;
//             }
//
//
//             counter += 1;
// //            console.log("%s - %s", counter, artist_length );
//             if( counter == artist_length ) {
//                 artist_ids = _.uniq(artist_ids) ;
//                 findSongsForArtists( artist_ids ) ;
//             }
//
//         }) ;
//
//     }) ;
//
//
// }) ;
//
//
//
//
// var findSongsForArtists = function( notNominatedArtists ) {
//     console.log(notNominatedArtists.length);
//     Song.find({
//         contest: null,
//             //
//             // $or: [{
//             //     $exists: false,
//             // },{
//             //     $in:['', null]
//             // }]
//         //},
//         youtubeUrl: {
//             $exists: true,
//             $nin: ['', null]
//         },/*
//         audiofile: {
//             $exists: false
//         },*/
//         artist: {
//             $in: notNominatedArtists
//         },
//         state: {
//             $in: ['active', 'pending']
//         }
//     })
//     .populate( 'artist', '_id state genres_own country genres_music name slug')
//     .exec( function(err, songs) {
//
//     //    console.log(err);
//         var postNominateSongs = _.chain( songs )
//             .reduce( function(ret, v ) {
//                 ret[ v.artist._id ] = ret[ v.artist._id ] || [] ;
//                 ret[ v.artist._id ].push( v ) ;
//                 return ret ;
//             }, {})
//             .reduce( function(ret, v, k ) {
//                 var song = _.chain(v).sortBy('plays').reverse().value()[0] || null ;
//
//                 if( song && song.artist.state == "'active'" ) {
//                     ret[k] = song ;
//                 }
//
//                 return ret ;
//             }, {})
//             .value() ;
//
//
//
//
//
//     console.log("artistId;artist name;artist slug;artist state;songs count;artist backend url;artist url;songId;song title;song contest;song slug;song state;song plays;song backend url;youtube url;count nominations;YT Error;YT Info");
//
//     var nomm = 0 ;
//         _.keys(postNominateSongs).forEach( function(k) {
//             var s = postNominateSongs[k] ;
//
//             Song.count({contest: '5391bc6069758716a25bb4a2', artist: s.artist._id } ).exec( function(err, count) {
//                 Song.count({ artist: s.artist._id }).exec( function(err, allCount) {
//                 var shouldNominate = true ;
//
//                 try {
//                     ytdl.getInfo( s.youtubeUrl, function(youtubeErr, youtubeInfo) {
//                         if( youtubeErr ) return ;
//
//
//                         nomm += 1 ;
//                         console.log("%s", nomm) ;
//                         console.log("nominate: %s %s %s", s.title, s.artist.name, s.artist.country );
//
//                         s.contest = "5391bc6069758716a25bb4a2" ;
//                         s.postNominated3 = true ;
//                         var artist = s.artist ;
//                         if( artist.genres_own == null || artist.genres_own.length == 0 ) artist.genres_own = ['Pop'] ;
//                         if( artist.genres_music == null || artist.genres_music.length == 0 ) artist.genres_music = ['Pop'] ;
//                         if( artist.country == null || artist.country == '' ) artist.country = 'US' ;
//
//                         s.country = artist.country || 'US' ;
//
//                         artist.save( function(err, updatedArtist) {
//                             if( err ) {
//                                 console.log('artist-save err: ');
//                                 console.log(err);
//                             }
//                         }) ;
//
//                         s.save( function(err, updatedSong) {
//                             if( err ) {
//                                 console.log("ERR: ") ;
//                                 console.log(err) ;
//                                 return ;
//                             }
//
//                             ChartEntry.create({
//                                 artist: s.artist,
//                                 song: s,
//                                 phase: 'np',
//                                 votes: 0,
//                                 pos: 0,
//                                 nPos: 0,
//                                 voteTypes: emptyVoteTypes,
//                                 contest: s.contest,
//                                 country: s.artist.country || "US",
//                                 postNominated3: true
//                             }, console.log) ;
//
//                         }) ;
//                         //
//
//                         //
//                         // console.log("'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s'",
//                         //     s.artist._id,
//                         //     s.artist.name,
//                         //     s.artist.slug,
//                         //     s.artist.state.toString().replace("'", '').replace("'", ''),
//                         //     allCount,
//                         //     "https://backend.globalrockstar.com/artists/" + s.artist.slug,
//                         //     "http://www.globalrockstar.com/artists/" + s.artist.slug,
//                         //     s._id,
//                         //     s.title,
//                         //     s.contest,
//                         //     s.slug,
//                         //     s.state.toString().replace("'", '').replace("'", ''),
//                         //     s.plays,
//                         //     "https://backend.globalrockstar.com/songs/" + s.slug,
//                         //     s.youtubeUrl,
//                         //     count,
//                         //     youtubeErr) ;
//                     }) ;
//
//
//                 } catch (e) {
//
//                     shouldNominate = false ;
//
//                     // console.log("'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s';'%s'",
//                     //     s.artist._id,
//                     //     s.artist.name,
//                     //     s.artist.slug,
//                     //     s.artist.state.toString().replace("'", '').replace("'", ''),
//                     //     allCount,
//                     //
//                     //     "https://backend.globalrockstar.com/artists/" + s.artist.slug,
//                     //     "http://www.globalrockstar.com/artists/" + s.artist.slug,
//                     //     s._id,
//                     //     s.title,
//                     //     s.contest,
//                     //     s.slug,
//                     //     s.state.toString().replace("'", '').replace("'", ''),
//                     //     s.plays,
//                     //     "https://backend.globalrockstar.com/songs/" + s.slug,
//                     //     s.youtubeUrl,
//                     //     count,
//                     //     e,
//                     //     '') ;
//                 }
//                 }) ;
//
//             }) ;
//
//
//
//         }) ;
//
//         // console.log("found: ");
//         // // console.log(postNominateSongs);
//         // console.log(_.keys( postNominateSongs).length )
//
//
//     }) ;
//
//
// }

