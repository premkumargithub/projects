'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    Song = mongoose.model('Song'),
    _ = require('lodash');

function songFactory() {
    return new Song({
        _id: ObjectId(),
        youtubeUrl: 'http://www.youtube.com/watch?v=E_LJaoiL2wQ#' + ObjectId(),
        title: 'some song title',
        audiofile: 'some file url',
        tags: ['some', 'cool', 'genres'],
        copyright_lyrics: 'lyric copyright text',
        copyright_music: 'music copyright text',
        copyright_publisher: 'publisher copyright text',
        sponsoring: false,
        reward: false,
    });
}

function validSong() {
    return new Q(songFactory());
}

function savedSong() {
    var song;
    return validSong()
        .then(function (s) {
            song = s;
            return Q.ninvoke(song, 'save');
        })
        .then(function () {
            return Q.ninvoke(Song.findOne({
                _id: song._id
            }), 'exec');
        }).fail(function (error) {
            console.error(error);
        });
}

module.exports = {
    validSong: validSong,
    savedSong: savedSong
};
