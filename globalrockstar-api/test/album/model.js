/* globals xit, it, describe, xdescribe, before, beforeEach, after, afterEach */
'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    mongoose = require('mongoose'),
    chai = require('chai'),
    expect = chai.expect,
    ObjectId = mongoose.Types.ObjectId,
    Q = require('q'),
    Album = mongoose.model('Album'),
    Artist = mongoose.model('Artist'),
    server = require('../../server'),
    albumMock = require('../mocks/album'),
    artistMock = require('../mocks/artist'),
    album,
    artistInstance;


describe('Albums Model', function () {
    before(function (done) {
        var createArtist = Q.nbind(Artist.create, Artist);
        createArtist(artistMock.getTiniestMock()).then(function (data) {
            artistInstance = data;
            var albumData = albumMock.getTiniestMock(artistInstance._id);
            album = new Album(albumData);
            done();
        });
    });

    after(function (done) {
        done();
    });

    it('should save an album', function (done) {
        album.save(function (err, savedAlbum) {
            Album.findOne({_id: savedAlbum._id}, function (err, savedAlbum) {
                expect(savedAlbum.title).to.equal(album.title);
                done();
            });
        });
    });

    it('should update only the updatable fields', function (done) {
        album.save(function (err, savedAlbum) {
            Album.findOne({_id: savedAlbum._id}, function (err, album) {
                album.safeUpdate({flagged: true}, 'admin').then(function (updatedAlbum) {
                    expect(updatedAlbum[0].flagged).to.be.true();
                    album.safeUpdate({flagged: false}, 'profile').then(function (updatedAlbum) {
                        expect(updatedAlbum[0].flagged).to.be.true();
                        done();
                    });
                });
            });
        });
    });
});
