/* globals describe, it, before, beforeEach, after, afterEach */
'use strict';

var Q = require('q'),
    config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    Artist = mongoose.model('Artist'),
    Contest = mongoose.model('Contest'),
    Song = mongoose.model('Song'),
    artistMock = require('../mocks/artists'),
    contestMock = require('../mocks/contest'),
    songMock = require('../mocks/song'),
    chai = require('chai'),
    expect = chai.expect,
    artistMockData = artistMock.getArtistMock(),
    artist;

var ObjectId = mongoose.Types.ObjectId;
var content;
var mobile = false;

describe('Artist Model schema tests: ', function () {
    beforeEach(function (done) {
        artist = new Artist(artistMockData);
        done();
    });

    afterEach(function (done) {
        Artist.remove({_id: artist._id}, done);
    });

    it('should update currency before save an artist', function (done) {
        artist.currency = 'dollar';
        artist.save(function (err) {
            done();
        });
    });

    it('should fail when saving a duplicate artist', function (done) {
        artist.save(function () {
            var artist2 = new Artist(artistMockData);
            artist2.save(function (err) {
                should.exist(err);
                done();
            });
        });
    });

    it('should fail when saving artist without an email', function (done) {
        artist.email = '';
        artist.save(function (err) {
            should.exist(err);
            done();
        });
    });

    it('should check when password is equal to confirm password', function (done) {
        artist.save(function (err) {
            expect(artistMockData.password).to.equal(artistMockData.password_confirmation);
            done();
        });
    });

    it('should allow to change the contest related media only if media has not already been associated to a different contest', function (done) {

        var artist = new Artist(artistMock.getArtistMock()),
            contest1 = new Contest(contestMock.getMock()),
            contest2 = new Contest(contestMock.getMock()),
            song1 = new Song(songMock.getMock()),
            song2 = new Song(songMock.getMock());

        // Remember: Always assign ._id to a type Schema.Types.ObjectId !!!
        song1.contest = contest1._id;
        song2.contest = contest2._id;

        expect(artist.canChangeContestMedia(song1, contest2)).to.be.false();
        expect(artist.canChangeContestMedia(song2, contest2)).to.be.true();
        //expect(artist.contestMedia).equal(song2.id);

        Contest.remove({_id: contest1.id}, function () {
            Contest.remove({_id: contest2.id}, function () {
                Song.remove({_id: song1.id}, function () {
                    Song.remove({_id: song2.id}, done);
                });
            });
        });
    });
});