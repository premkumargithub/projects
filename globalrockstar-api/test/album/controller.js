/* globals describe, it, xdescribe, xit, before, after, beforeEach, afterEach, xdescribe, xit */
'use strict';

var should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Album = mongoose.model('Album'),
    Artist = mongoose.model('Artist'),
    Q = require('q'),
    utils = require('../mocks/_utils'),
    artistMock = require('../mocks/artist'),
    albumMock = require('../mocks/album'),
    server = require('../../index'),
    createArtist = Q.nbind(Artist.create, Artist),
    artistInstance;

describe('REST API for albums', function () {

    beforeEach(function (done) {
        createArtist(artistMock.getTiniestMock()).then(function (data) {
            artistInstance = data;
            done();
        });
    });

    afterEach(function (done) {
        utils.removeEntry(Artist, artistInstance.id, done);
    });


    describe('GET requests', function () {
        it('should reply with 200', function (done) {
            utils.inject('GET', '/albums', function (statusCode) {
                expect(statusCode).to.equal(200);
                done();
            });
        });

        it('should give me an album by id', function (done) {
            var albumData = albumMock.getTiniestMock(artistInstance._id);

            utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                var postPayload = jsonPayload;
                utils.inject('GET', '/albums/' + postPayload._id, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(postPayload._id).to.equal(jsonPayload._id);
                    utils.removeEntry(Album, postPayload._id, done);
                });
            });
        });

        it('should give me all the albums information', function (done) {
            createArtist(artistMock.getTiniestMock()).then(function (artist2Instance) {

                var albumData = albumMock.getTiniestMock(artistInstance._id),
                    album2Data = albumMock.getTiniestMock(artist2Instance._id);

                utils.inject('POST', '/albums', albumData, function (statusCode, album1payload, res) {
                    utils.inject('POST', '/albums', album2Data, function (statusCode, album2payload, res) {
                        utils.inject('GET', '/albums', function (statusCode, albumspayload, res) {

                            expect(statusCode).to.equal(200);
                            expect(albumspayload).to.be.an('array');
                            expect(albumspayload.length).to.be.least(2);

                            utils.removeEntry(Album, album1payload._id, function () {
                                utils.removeEntry(Album, album2payload._id, done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('POST requests', function () {

        it('should let me add a new album with the smallest amount of information', function (done) {
            var albumData = albumMock.getTiniestMock(artistInstance._id);

            utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {

                expect(statusCode).to.equal(201);
                expect(jsonPayload.title).to.equal(albumData.title);
                expect(jsonPayload.artist._id).to.equal(artistInstance.id);
                utils.removeEntry(Album, jsonPayload._id, done);
            });
        });

        it('should let me add a new album with the largest amount of information', function (done) {
            var albumData = albumMock.getMock();
            albumData.artist = artistInstance._id;

            utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                expect(statusCode).to.equal(201);

                expect(jsonPayload.title).to.equal(albumData.title);
                expect(jsonPayload.artist._id).to.equal(artistInstance.id);
                expect(jsonPayload.flagged).to.equal(albumData.flagged);
                expect(jsonPayload.flagged_reason).to.equal(albumData.flagged_reason);
                expect(jsonPayload.publisher).to.equal(albumData.publisher);
                expect(jsonPayload.stars).to.equal(albumData.stars);
                expect(jsonPayload.state).to.equal(albumData.state);

                utils.removeEntry(Album, jsonPayload._id, done);
            });
        });

        it('should fail when I try to add inconsistent data', function (done) {
            var albumData = albumMock.getTiniestMock();

            utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                expect(statusCode).to.equal(400);

                albumData.artist = artistInstance._id;

                utils.inject('POST', '/albums', albumData, function (statusCode, createdAlbum1, res) {
                    expect(statusCode).to.equal(201);

                    albumData.genres = ['no-genre'];

                    utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                        expect(statusCode).to.equal(400);


                        albumData.genres = ['Pop'];
                        albumData.state = 'no-state';

                        utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                            expect(statusCode).to.equal(400);

                            albumData.state = 'pending';

                            utils.inject('POST', '/albums', albumData, function (statusCode, createdAlbum2, res) {
                                expect(statusCode).to.equal(201);
                                utils.removeEntry(Album, createdAlbum1._id, function () {
                                    utils.removeEntry(Album, createdAlbum2._id, done);
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    describe('PUT requests', function () {
        it('should let me edit an existing album', function (done) {
            var albumData = albumMock.getTiniestMock(artistInstance._id);

            utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                var editedAlbum = jsonPayload;

                editedAlbum.title = "new_title";

                utils.inject('PUT', '/albums/' + editedAlbum._id, editedAlbum, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload.title).to.equal(editedAlbum.title);
                    utils.removeEntry(Album, jsonPayload._id, done);
                });
            });
        });

        it('should fail when I try to update the album with wrong data', function (done) {
            var albumData = albumMock.getTiniestMock(artistInstance._id);

            utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                var editedAlbum = jsonPayload;

                editedAlbum.genres = ["no-genre"];

                utils.inject('PUT', '/albums/' + editedAlbum._id, editedAlbum, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(400);
                    editedAlbum.genres = ["Pop"];
                    delete editedAlbum.state;

                    utils.inject('PUT', '/albums/' + editedAlbum._id, editedAlbum, function (statusCode, jsonPayload, res) {
                        expect(statusCode).to.equal(400);
                        editedAlbum.state = "pending";

                        utils.inject('PUT', '/albums/' + editedAlbum._id, editedAlbum, function (statusCode, jsonPayload, res) {
                            expect(statusCode).to.equal(200);
                            utils.removeEntry(Album, jsonPayload._id, done);
                        });
                    });
                });
            });
        });
    });

    describe('DELETE requests', function () {
        it('should remove an album by id', function (done) {
            var albumData = albumMock.getTiniestMock(artistInstance._id);

            utils.inject('POST', '/albums', albumData, function (statusCode, jsonPayload, res) {
                var docId = jsonPayload._id;
                utils.inject('DELETE', '/albums/' + docId, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    utils.inject('GET', '/albums/' + docId, function (statusCode, jsonPayload, res) {
                        expect(jsonPayload).to.be.null();
                        done();
                    });
                });
            });
        });
    });
});
