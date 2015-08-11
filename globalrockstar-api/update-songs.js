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

    var csvStream = csv({
        delimiter: ','
    }).on("record", function(data) {

        if (data[0] === 'user_id') return;

        sc += 1;

        var artistId = data[0];
        var youtubeUrl = data[2].trim();

        Song.count({
            youtubeUrl: youtubeUrl
        }, function(err, res) {

            if (res > 0) return;


            var views = data[3] && data[3].replace(/\s/g, '') != "" ?
                parseInt(data[3]) : 0;
            var likes = data[4] && data[4].replace(/\s/g, '') != "" ?
                parseInt(data[4]) : 0;
            var finalChart2013 = data[5] && data[5].replace(/\s/g,
                '') != "" ? parseInt(data[5]) : 0;
            var nationalChart2013 = data[6] && data[6].replace(
                /\s/g, '') != "" ? parseInt(data[6]) : 0;

            // "user_id","title","video url","views","likes","final chart position 2013","national final 2013","hat 2013 teilgenommen","beschreibung","publiziert am","featured artist",


            var payload = {
                title: data[1].replace(/[\*\)\(]/g, '.'),
                youtubeUrl: data[2],
                state: 'active',
                plays: views,
                contest: contest,
                legacy: {
                    views: views,
                    likes: likes,
                    finalChart2013: finalChart2013,
                    nationalChart2013: nationalChart2013,
                    entry2013: data[7] !== 'nein',
                    createdAt: new Date(data[9])
                },
                description: data[8],
                createdAt: new Date(data[9])
            };

            payload.contest = payload.legacy.entry2013 ? contest :
                null;

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

                var song = new Song(payload);
                song.artist = artist;
                console.log(song);
                song.save(function(err, res) {
                    if (err) {
                        console.log("ERR SONG ");
                        console.log(err);
                        return;
                    }
                    if ( data[10] && data[10].trim() == 'ja') {
                        artist.featured = true;
                        artist.save(function(err, res) {});
                    }
                    ic += 1;
                    //            console.log(sc + "/" + ic );
                });

            });


        });

    })
        .on("end", function() {
            console.log("end");
        });

    stream.pipe(csvStream);

});
