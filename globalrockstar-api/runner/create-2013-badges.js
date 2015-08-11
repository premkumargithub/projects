// process.env.NODE_ENV = 'legacy' ;

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Hapi = require('hapi');

var Song = mongoose.model('Song');
var Badge = mongoose.model('Badge');

function createBadge(type, song) {
    (new Badge({
        type: type,
        userId: song.artist,
        userType: 'artist',
        contest: '53a43e4bdf9df79258d92a38'

    })).save(function (err) {
        console.log(song.title + ' ' + type);
        if (err) console.error(err);
    });
}

Song.find({
    legacy: {
        $exists: true
    }
}, function (err, songs) {
    songs.forEach(function (song) {
        var data = song.legacy;
        if (data.nationalChart2013 == 1) {
            createBadge('nationalwinner', song);
        }

        if (data.finalChart2013 == 1) {
            createBadge('globalrockstar', song);
        }
    });
});
