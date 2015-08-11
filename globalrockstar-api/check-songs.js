process.env.NODE_ENV = 'legacy';

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    Hapi = require('hapi');

console.log(config);

var transform = require('stream-transform');

var Artist = mongoose.model('Artist');
var Song = mongoose.model('Song');
var Contest = mongoose.model('Contest');
var fs = require('fs');
var csv = require('fast-csv');

var stream = fs.createReadStream("./_legacy/new-songs.csv");
var request = require('request');


// user_id;title;video url;views;likes;final chart position 2013;national final 2013;hat 2013 teilgenommen;beschreibung


var sc = 0;
var notFound = 0;
var ic = 0;

var csvStream = csv({
    delimiter: '$$$'
}).on("record", function(data) {

    if (data[0] === 'user_id') return;

    sc += 1;

    var artistId = data[0];
    var videoUrl = data[2].trim();

    Song.count({
        youtubeUrl: videoUrl
    }, function(err, count) {
        if (count == 0) {
            console.log( data.join("$$$") ) ;

            notFound += 1;
        }
    })

}).on("end", function() {
    console.log("end");
});

stream.pipe(csvStream);
