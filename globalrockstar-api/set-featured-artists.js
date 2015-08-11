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

var stream = fs.createReadStream("./_legacy/songs.csv");
var request = require('request');


// user_id;title;video url;views;likes;final chart position 2013;national final 2013;hat 2013 teilgenommen;beschreibung


var sc = 0;
var ic = 0;


var contestId = '53a43e4bdf9df79258d92a38';
Contest.findById(contestId).exec(function(err, contest) {

    var featured = 0;
    var csvStream = csv({
        delimiter: ','
    }).on("record", function(data) {

        if (data[0] === 'user_id') return;

        sc += 1;

        var artistId = data[0];

        //console.log(payload) ;
        Artist.findOne({
            "legacy.id": artistId
        }, function(err, artist) {
            if (err) {
                console.log("ERR: ");
                console.log(err);
                return;
            }
            if (!artist) {
                console.log("NO ARTIST FOUND FOR ID " +
                    artistId);
                return;
            }

            if (data[10] == 'ja') {
                featured += 1;
                console.log("FEATURED " + featured);
                artist.featured = true ;
                artist.save(function(err, res) {
                    console.log(err);
                } ) ;
            }
            ic += 1;
            //            console.log(sc + "/" + ic );
        });

    })
        .on("end", function() {
            console.log("featured" + featured);
            console.log("end");
        });

    stream.pipe(csvStream);

});
