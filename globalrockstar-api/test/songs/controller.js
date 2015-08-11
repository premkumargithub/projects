/* globals describe, it, xdescribe, xit, before, after, beforeEach, afterEach, xdescribe, xit */
'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    Q = require('q'),
    mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Contest = mongoose.model('Contest'),
    Song = mongoose.model('Song'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    utils = require('../mocks/_utils'),
    server = require('../../index'),
    createArtist = Q.nbind(Artist.create, Artist),
    songMock = require('../mocks/song'),
    artistMock = require('../mocks/artist'),
    artistInstance;

describe('REST API for songs', function () {

    beforeEach(function (done) {
        createArtist(artistMock.getTiniestMock()).then(function (data) {
            artistInstance = data;
            done();
        });
    });

    afterEach(function (done) {
        utils.removeEntry(Artist, artistInstance._id, done);
    });

    describe('GET requests', function () {
        it('Get the Total count of the song ', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, receivedSongData, res) {
                utils.inject('GET', '/songs/count', function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload[0].total).to.be.a('number');
                    expect(jsonPayload[0].total).to.be.at.least(1);

                    utils.removeEntry(Song, receivedSongData._id, done);
                });
            });
        });

        it('Should return the song count of selected user ', function (done) {
            var songData = songMock.getMock(),
                song2Data = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, receivedSongData, res) {
                utils.inject('POST', url, song2Data, function (statusCode, receivedSong2Data, res) {
                    utils.inject('GET', url + '/count', function (statusCode, jsonPayload, res) {
                        expect(statusCode).to.equal(200);
                        expect(jsonPayload.count).to.equal(2);
                        utils.removeEntry(Song, receivedSongData._id, function () {
                            utils.removeEntry(Song, receivedSong2Data._id, done);
                        });
                    });
                });
            });
        });


        it('Should return a specific song (passing a defined user id)', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, receivedSongData, res) {
                var songId = receivedSongData._id;
                utils.inject('GET', url + '/' + songId, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload.title).to.equal(songData.title);
                    utils.removeEntry(Song, receivedSongData._id, done);
                });
            });
        });

        it('Should return a specific song', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, receivedSongData, res) {
                var songId = receivedSongData._id;
                utils.inject('GET', '/songs/' + songId, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload.title).to.equal(songData.title);
                    utils.removeEntry(Song, receivedSongData._id, done);
                });
            });
        });
    });

    describe('POST requests', function () {

        it('should create a song with the smallest amount of info possible', function (done) {
            var songData = songMock.getTiniestMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, jsonPayload, res) {
                expect(statusCode).to.equal(201);
                utils.removeEntry(Song, jsonPayload._id, done);
            });
        });

        it('should create a song', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, jsonPayload, res) {
                expect(statusCode).to.equal(201);
                utils.removeEntry(Song, jsonPayload._id, done);
            });
        });

        // TODO: an artist must be verified to upload songs
        xit('should fail if an artist is not yet verified', function (done) {

        });

        it('should create a song and get detailed info', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, receivedSong, res) {
                expect(statusCode).to.equal(201);
                var songId = receivedSong._id;
                utils.inject('GET', '/songs/' + songId, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);

                    expect(jsonPayload.title).to.equal(songData.title);
                    expect(jsonPayload.order).to.equal(songData.order);
                    expect(jsonPayload.genres).to.have.same.members(songData.genres);
                    expect(jsonPayload.gr_doc_ver).to.equal(2);
                    expect(jsonPayload.realPlays).to.equal(0);
                    expect(jsonPayload.plays).to.equal(0);

                    utils.removeEntry(Song, receivedSong._id, done);
                });
            });
        });

        it('should create a song and get the right artist binding', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, jsonPayload, res) {
                expect(statusCode).to.equal(201);
                var songId = jsonPayload._id;
                utils.inject('GET', '/songs/' + songId, function (statusCode, jsonPayload, res) {
                    expect(jsonPayload.artist._id).to.equal(artistInstance.id);
                    utils.removeEntry(Song, jsonPayload._id, done);
                });
            });
        });
    });

    describe('DELETE requests', function () {
        it('should delete a song', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance._id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, jsonPayload, res) {
                expect(statusCode).to.equal(201);
                var songId = jsonPayload._id;
                utils.inject('DELETE', '/songs/' + songId, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    utils.inject('GET', '/songs/' + songId, function (statusCode, jsonPayload, res) {
                        expect(statusCode).to.equal(404);
                        done();
                    });
                });
            });
        });
    });


    describe('PUT requests', function () {
        it('should update a song and change the state (via frontend)', function (done) {
            var songData = songMock.getMock(),
                url = '/artists/' + artistInstance.id + '/songs';

            utils.inject('POST', url, songData, function (statusCode, jsonPayload, res) {

                var songId = jsonPayload._id;
                songData.title = "very awesome song";
                songData.state = "active";

                utils.inject('PUT', '/songs/' + songId, songData, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload.title).to.equal("very awesome song");
                    expect(jsonPayload.state).to.equal("active");
                    done();
                });
            });
        });
    });


    //To pass this test case you have to comment some code in controller/songs.js
    //from line 261 to 270 and 305 to 324
    // Because the code fire undefined error in these code
    xit('should nominate a song', function (done) {
        server.inject({
            method: 'POST',
            url: '/artists/' + artist_id + '/songs',
            payload: JSON.stringify(songData),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            expect(res.statusCode).to.equal(200);
            var pid = res.result.id;
            server.inject({
                method: 'POST',
                url: '/songs/' + pid + '/nominate',
                payload: JSON.stringify(songData),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(200);
                expect(res.result.contest).to.exist;
                done();
            });
        });
    });

    //To pass this test case you have to comment some code in controller/songs.js
    //from line 261 to 270 and 305 to 324
    // Because the code fire undefined error in these code
    xit('should nominate only one song', function (done) {
        server.inject({
            method: 'POST',
            url: '/artists/' + artist_id + '/songs',
            payload: JSON.stringify(songData),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            expect(res.statusCode).to.equal(200);
            var pid = res.result.id;

            server.inject({
                method: 'POST',
                url: '/songs/' + pid + '/nominate',
                payload: JSON.stringify(songData),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(200);
                expect(res.result.contest).to.exist;
                Song.count({contest: {$ne: null}}, function (err, count) {
                    expect(count).to.equal(1);
                });
                done();
            });

        });
    });


    // Command to test this cases
    //  LOCAL_DB=1 LOCAL_REDIS=1 LOCAL_ELASTIC=1 NODE_ENV=test gulp valid
    // Added by abhinav nehra
    xit('should increase playcount of a song', function (done) {
        songData.youtubeUrl = 'http://youtube.com/watch?v=qkdsOWfSXME';
        server.inject({
            method: 'POST',
            url: '/artists/' + artist_id + '/songs',
            payload: JSON.stringify(songData),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            expect(res.statusCode).to.equal(200);
            var pid = res.result.id;

            server.inject({
                method: 'PUT',
                url: '/songs/' + pid + '/played',
                payload: JSON.stringify({}),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(200);
                expect(res.result.plays).to.equal(1);

                server.inject({
                    method: 'GET',
                    url: '/artists/' + artist_id,
                    headers: {'Content-Type': 'application/json'}
                }, function (res) {
                    expect(res.statusCode).to.equal(200);
                    expect(res.result.totalPlays).to.equal(1);
                    done();
                });
            });
        });
    });

    // Command to test this cases
    //  LOCAL_DB=1 LOCAL_REDIS=1 LOCAL_ELASTIC=1 NODE_ENV=test gulp valid
    // Added by abhinav nehra
    xit('should increase playcount of a song without youtubeUrl', function (done) {
        delete songData.youtubeUrl;
        songData.audiofile = 'someaudiofile.mp3';

        server.inject({
            method: 'POST',
            url: '/artists/' + artist_id + '/songs',
            payload: JSON.stringify(songData),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            expect(res.statusCode).to.equal(200);
            var pid = res.result.id;

            server.inject({
                method: 'PUT',
                url: '/songs/' + pid + '/played',
                payload: JSON.stringify({}),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(200);
                expect(res.result.plays).to.equal(1);

                server.inject({
                    method: 'GET',
                    url: '/artists/' + artist_id,
                    headers: {'Content-Type': 'application/json'}
                }, function (res) {
                    expect(res.statusCode).to.equal(200);
                    expect(res.result.totalPlays).to.equal(1);
                    done();
                });

            });
        });
    });
});
