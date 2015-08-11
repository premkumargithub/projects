/**
 * @module Lib:Song-Count-Plays
 * @description Provides a pre load actions before Db query fires
 * @requires module:../models/artist
 * @requires module:../models/song
 */
var Artist = require('../models/artist'),
    Song = require('../models/song');

/**
 * @param {object} song Song model object 
 * @description Used to save the song in Song model and retrieve the find song, artist
 */
module.exports = function (song) {
    song.plays = song.plays + 1 || 1;
    song.save(song);
    //Get song based on artist id
    Song.find({artist: song.artist._id}, function (err, songs) {
        var plays = 0;
        songs.some(function (song) {
            plays = plays + song.plays;
        });
        //Get artist based on the artist id
        Artist.findById(song.artist._id, function (err, artist) {
            artist.totalPlays = plays;
            artist.save(artist);
        });
    });
};
