/* globals describe, it, before, beforeEach, after, afterEach */
'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Song = mongoose.model('Song'),
    Artist = mongoose.model('Artist'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    songMock = require('../mocks/song'),
    artistMock = require('../mocks/artist'),
    server = require('../../server');


describe('Song Model', function () {

    it('should save a song', function (done) {

        var artist = new Artist(artistMock.getTiniestMock());
        artist.save(function (err, artistInstance) {
            var song = new Song(songMock.getMock(artistInstance.id));
            song.save(function (err, songInstance) {

                expect(songInstance.title).to.equal(song.title);
                expect(songInstance.plays).to.equal(0);
                expect(songInstance.realPlays).to.equal(0);

                Song.remove({_id: songInstance.id}, function (err) {
                    done();
                });
            });
        });
    });


    it('should associate a song with an artist', function (done) {

        var artist = new Artist(artistMock.getTiniestMock());
        artist.save(function (err, artistInstance) {
            var song = new Song(songMock.getMock());
            song.artist = artistInstance;
            song.save(function (err, songInstance) {
                expect(songInstance.artist.toString()).to.equal(artist.id);
                Song.findOne({artist: artist.id}, function (err, song) {
                    expect(err).to.not.exist();
                    Song.remove({_id: songInstance.id}, done);
                });
            });
        });
    });
});