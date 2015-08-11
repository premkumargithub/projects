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


var s3 = "http://grs-centralstore-01.s3.amazonaws.com/videos/" ;
var s3_thumbs = "http://grs-centralstore-01.s3.amazonaws.com/video_thumbs/" ;



var path = require('path') ;
var fs = require('fs') ;
var fs = require('graceful-fs')
var missing = [] ;
var ytdl = require('ytdl-core');


var cId = '5391bc6069758716a25bb4a2' ;

function youtubeId(text) {
    var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
    return text.replace(re, '$1') ;
}

var s3Config = {
        accessKeyId: "AKIAJP4XFJQN5L53QVCA",
        secretAccessKey: "4530X+F0rGGDUxyOEEIR+bpN8rc29TdzjhlkA104"
    } ;

var AWS = require('aws-sdk') ;

var uploadS3 = function(file, s3folder, done) {
    AWS.config.update(s3Config);

    var filename = path.basename( file ) ;
    var key = s3folder + "/" + filename ;

    var s3 = new AWS.S3();

    s3.listObjects({
        Bucket: 'grs-centralstore-01',
        MaxKeys: 10,
        Prefix: key
    }, function(err, data) {
        console.log(data);
        if (data.Contents.length > 0) {
            console.log("file already exists on S3");
            return ;
        }

        fs.readFile(file, function(err, data) {
            s3.putObject({
                Bucket: 'grs-centralstore-01',
                Key: key,
                Body: data,
                ACL: 'public-read'
            }, function(resp) {
                console.log('successfully uploaded');
                fs.unlink( file, function(err) {
                    if( err ) console.log(err);
                }) ;
            });
        });

    });
}
var downloadVideoFromYT = function (youtubeUrl, done) {
        
        var yid = youtubeId(youtubeUrl);
        var filename = '' + yid + '.mp4';
        var path = './tmp/';
        var ws = fs.createWriteStream(path + filename);

        ws.on('finish', function () {
          done() ;
          uploadS3( path + filename, 'videos' ) ;
        });

        console.log(youtubeUrl) ;
        ytdl(youtubeUrl, {
            filter: function (format) {
                return format.container === 'mp4';
            }
        }).on('error', function (err) {
            console.error('YT Download failed =>');
            console.error(err);
        }).pipe(ws);
};

Song.find({ contest: cId, state: { $in: ['active', 'pending'] } }).select('_id title youtubeUrl').exec( function(err, res) {
    
    console.log(res.length);

    var videos = _.pluck(res, 'youtubeUrl') ;

    var videos_length = videos.length ;
    var counter = 0 ;
    var bla = function() {

      if( videos.length == 0 ) return ;

      var youtubeUrl = videos.shift() ;
        var youId = youtubeId( youtubeUrl ) ;
        youId = youId.split("#")[0] ;
        var file = s3 + youId + ".mp4" ;
        
        console.log("requesting %s", file ) ;
        request.head( file, function(err, res) {
          console.log(err) ;
            if( res.statusCode == 403 && missing.indexOf( youtubeUrl ) === -1 ) {
          //      console.log(song._id + ";" + song.title + ";" + youtubeUrl) ;
              //  console.log(youtubeUrl);
             //   console.log("-> " + youId);
          //      console.log(missing.length);
              counter += 1;
                 console.log("%s/%s", counter, videos_length) ; 
                 downloadVideoFromYT( youtubeUrl, bla ) ;
            }
        }) ;
    } ;

    bla() ;
}) ;



