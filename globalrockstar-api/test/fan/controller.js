/* globals describe, it, before, after, beforeEach, afterEach, xdescribe, xit */
'use strict';

var artistMock = require('../mocks/artist'),
    fanMock = require('../mocks/fan'),
    songMock = require('../mocks/song'),
    projectsMock = require('../mocks/projects'),
    paymentMock = require('../mocks/payment'),
    config = require('../../lib/database'),
    models = require('../../models'),
    Q = require('q'),
    mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Song = mongoose.model('Song'),
    Fan = mongoose.model('Fan'),
    Vote = mongoose.model('Vote'),
    Payment = mongoose.model('Payment'),
    Project = mongoose.model('Project'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var createArtist = Q.nbind(Artist.create, Artist);
var createFan = Q.nbind(Fan.create, Fan);
var createSong = Q.nbind(Song.create, Song);
var createVote = Q.nbind(Vote.create, Vote);
var createPayment = Q.nbind(Payment.create, Payment);

var appJSONHeader = {
    'Content-Type': 'application/json'
};

var fanResult;

describe('REST requests for Fan', function () {

    var removeArtist = function (id, done) {
        Artist.remove({_id: id}, function () {
            done();
        });
    };
    var removeFan = function (id, done) {
        Fan.remove({_id: id}, function () {
            done();
        });
    };
    var removeSong = function (id, done) {
        Song.remove({_id: id}, function () {
            done();
        });
    };

    it('should create a fan', function (done) {
        var fanData = fanMock.getTiniestMock();
        server.inject({
            method: 'POST',
            url: '/fans',
            payload: JSON.stringify(fanData),
            headers: appJSONHeader
        }, function (res) {
            var fanObj = res.result;
            expect(res.statusCode).to.equal(200);
            expect(fanObj.firstname).to.equal(fanData.firstname);
            expect(fanObj.lastname).to.equal(fanData.lastname);
            expect(fanObj.country).to.equal(fanData.country);
            expect(fanObj.email).to.equal((fanData.email).toLowerCase());
            // FIXME: check why fanObj.state string is seen as an object
            //expect(fanObj.state).to.equal("pending");
            expect(fanObj.gender).to.equal("prefer_not_to_say");
            expect(fanObj.preferredCountry).to.equal(undefined);
            expect(fanObj.verified).to.equal(undefined);
            expect(fanObj.isComplete).to.equal(undefined);
            expect(fanObj.lastLoginTimestamp).to.equal(undefined);
            expect(fanObj.genres).to.have.same.members(fanData.genres);
            expect(fanObj.verificationToken).exist();
            expect(fanObj.slug).exist();

            removeFan(fanObj.id, done);
        });
    });

    it('should find favorite artists', function (done) {
        var fanObj,
            artistObj;

        Q.allSettled([
            createFan(fanMock.getTiniestMock()),
            createArtist(artistMock.getTiniestMock())
        ]).then(function (data) {
            fanObj = data[0].value;
            artistObj = data[1].value;
            artistObj.fans.push(fanObj);
            return Q.ninvoke(artistObj, 'save');
        }).then(function () {

            // Get all the favourite artists of a fan
            server.inject({
                method: 'GET',
                url: '/fans/' + fanObj._id + "/favorite-artists",
                headers: appJSONHeader
            }, function (res) {
                var payload = JSON.parse(res.payload);
                expect(res.statusCode).to.equal(200);
                expect(payload.length).to.equal(1);
                expect(payload[0]._id).to.equal(artistObj._id.toString());

                removeFan(fanObj._id, function () {
                    removeArtist(artistObj._id, done);
                });
            });
        }).fail(function (err) {
            console.log(err);
        });
    });

    it('should fail when creating fans with same email', function (done) {

        var fanData = fanMock.getTiniestMock(),
            fanObject;

        server.inject({
            method: 'POST',
            url: '/fans',
            payload: JSON.stringify(fanData),
            headers: appJSONHeader
        }, function (firstFanRes) {
            fanObject = firstFanRes.result;
            server.inject({
                method: 'POST',
                url: '/fans',
                payload: JSON.stringify(fanData),
                headers: appJSONHeader
            }, function (secondFanRes) {
                expect(secondFanRes.statusCode).to.equal(400);
                removeFan({_id: fanObject.id}, done);
            });
        });
    });

    it('should update an existing fan', function (done) {

        var fanData = fanMock.getTiniestMock(),
            modifiedFanData = fanMock.getTiniestMock();

        modifiedFanData.firstname += 'mod_' + fanData.firstname;
        modifiedFanData.lastname += 'mod_' + fanData.lastname;
        modifiedFanData.country = 'France';
        modifiedFanData.genres = ['Pop'];
        modifiedFanData.newsletter = false;
        modifiedFanData.picture = '/path/to/image.jpg';
        modifiedFanData.gender = 'male';
        modifiedFanData.birthdate = '1980-01-01T00:00:00.000Z';

        Fan.create(fanData, function (err, obj) {
            server.inject({
                method: 'PUT',
                url: '/fans/' + obj._id,
                payload: JSON.stringify(modifiedFanData),
                headers: appJSONHeader
            }, function (res) {
                var modFanData = res.result;
                expect(res.statusCode).to.equal(200);
                expect(modFanData.firstname).to.equal(modifiedFanData.firstname);
                expect(modFanData.lastname).to.equal(modifiedFanData.lastname);
                expect(modFanData.country).to.equal(modifiedFanData.country);
                expect(modFanData.genres).to.have.same.members(modifiedFanData.genres);
                expect(modFanData.newsletter).to.equal(modifiedFanData.newsletter);
                expect(modFanData.picture).to.equal(modifiedFanData.picture);
                expect(modFanData.gender).to.equal(modifiedFanData.gender);
                expect(modFanData.birthdate.toString()).to.equal(new Date(modifiedFanData.birthdate).toString());
                removeFan({_id: modFanData._id}, done);
            });
        });
    });

    it('should fail when password is too short', function (done) {

        var fanData = fanMock.getTiniestMock();
        fanData.password = "12";

        server.inject({
            method: 'POST',
            url: '/fans',
            payload: JSON.stringify(fanData),
            headers: appJSONHeader
        }, function (res) {
            expect(res.statusCode).to.equal(400);
            expect(JSON.parse(res.payload).data[0].message).to.equal("password length must be at least 8 characters long");
            removeFan(res.result.id, done);
        });
    });

    it('should fail when password confirmation does not match', function (done) {
        var fanData = fanMock.getTiniestMock();
        fanData.password_confirmation = "123456789123456";

        server.inject({
            method: 'POST',
            url: '/fans',
            payload: JSON.stringify(fanData),
            headers: appJSONHeader
        }, function (res) {
            expect(res.statusCode).to.equal(400);
            expect(JSON.parse(res.payload).data[0].message).to.equal("password_confirmation must be one of ref:password");
            removeFan(res.result.id, done);
        });
    });

    it('should return fans purchased songs', function (done) {
        var fanData = fanMock.getTiniestMock();
        Fan.create(fanData, function (err, obj) {
            fanResult = obj;
            var options = {
                method: "GET",
                url: "/fans/" + fanResult._id + "/songs",
                headers: { 'Content-Type': 'application/json' }
            };
            server.inject(options, function (res) {
                expect(res.statusCode).to.equal(200);
                res.should.have.property('payload');
                var results = JSON.parse(res.payload);
                results.should.have.property('total');
                results.should.have.property('results');
                done();
            });
        });
    });

    it('should return fans purchased products :: TODO after API update', function (done) {
        var options = {
            method: "GET",
            url: "/fans/" + fanResult._id + "/physical-products",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(200);
            res.should.have.property('payload');
            var results = JSON.parse(res.payload);
            results.should.have.property('total');
            results.should.have.property('results');
            done();
        });
    });

    it('should return fans purchased albums :: TODO after API update', function (done) {
        var options = {
            method: "GET",
            url: "/fans/" + fanResult._id + "/albums",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(200);
            res.should.have.property('payload');
            var results = JSON.parse(res.payload);
            results.should.have.property('total');
            results.should.have.property('results');
            done();
        });
    });

    it('should return fans purchased stats :: TODO after API update', function (done) {
        var options = {
            method: "GET",
            url: "/fans/" + fanResult._id + "/stats",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(200);
            res.should.have.property('payload');
            var results = JSON.parse(res.payload);
            removeFan(fanResult._id, done);
        });
    });

    it('should delete a fan', function (done) {
        var fanData = fanMock.getTiniestMock();
        Fan.create(fanData, function (err, obj) {
            server.inject({
                method: 'DELETE',
                url: '/fans/' + obj._id
            }, function (res) {
                expect(res.statusCode).to.equal(200);
                Fan.findOne({
                    _id: obj._id
                }, function (err, fan) {
                    expect(fan).to.not.exist();
                    done();
                });
            });
        });
    });

    // This test fails due to the deprecation of the APIs used by model/song.js and helper/youtube-info.js
    // TODO: WE PROBABLY DON'T NEED THESE YOUTUBE METADATA ANYMORE
    xit('should find favorite songs', function (done) {
        var fanData = fanMock.getTiniestMock();
        var artistData = artistMock.getTiniestMock();
        var songData = songMock.getMock();

        var fanObj = null;
        var artistObj = null;
        var songObj = null;

        Q.allSettled([
            createFan(fanData),
            createArtist(artistData)
        ]).then(function (data) {

            fanObj = data[0].value;
            artistObj = data[1].value;
            artistObj.fans.push(fanObj);
            return Q.allSettled([
                Q.ninvoke(artistObj, 'save'),
                createSong(songData)
            ]);
        }).then(function (data2) {
            songObj = data2[1].value;
            server.inject({
                method: 'GET',
                url: '/fans/' + fanObj._id + "/favorite-songs",
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                var payload = JSON.parse(res.payload);
                expect(res.statusCode).to.equal(200);
                expect(payload.length).to.equal(1);
                expect(payload[0]._id).to.equal(songObj._id.toString());

                removeFan({_id: fanObj._id}, function () {
                    removeArtist({_id: artistObj._id}, function () {
                        removeSong({_id: songObj._id}, done);
                    });
                });
            });
        }).fail(function (err) {
            console.log(err);
        });
    });

    it('return the fan stats count 0', function (done) {
        var fanData = fanMock.getTiniestMock();
        var fanObj = null;
        server.inject({
            method: 'POST',
            url: '/fans',
            payload: JSON.stringify(fanData),
            headers: appJSONHeader
        }, function (res) {
            fanObj = res.result;
            server.inject({
                method: 'GET',
                url: '/fans/' + fanObj.id + '/stats/count',
                headers: appJSONHeader
            }, function (res) {
                var result = res.result;
                expect(res.statusCode).to.equal(200);
                expect(result.totalVotes).to.equal(0);
                expect(result.expenses.projects).to.equal(0);
                expect(result.followCount).to.equal(0);
                expect(result.totalPlay).to.equal(0);
                removeFan({_id: fanObj.id}, done);
            });
        });
    });

    it('should increase the fan followCount by one', function (done) {
        var fanData = fanMock.getTiniestMock();
        var artistData = artistMock.getTiniestMock();
        var songData = songMock.getMock();

        var fanObj = null;
        var artistObj = null;
        var songObj = null;

        Q.allSettled([
            createFan(fanData),
            createArtist(artistData)
        ]).then(function (data) {
            fanObj = data[0].value;
            artistObj = data[1].value;
            server.inject({
                method: 'POST',
                url: '/artists/' + artistObj._id + '/fan',
                payload: JSON.stringify({'_id': fanObj._id, 'type': 'fan'}),
                headers: appJSONHeader
            }, function (res) {
                server.inject({
                    method: 'GET',
                    url: '/fans/' + fanObj.id + '/stats/count',
                    headers: appJSONHeader
                }, function (res) {
                    var result = res.result;
                    expect(res.statusCode).to.equal(200);
                    expect(result.followCount).to.equal(1);
                    removeFan({_id: fanObj._id}, function () {
                        removeArtist({_id: artistObj._id}, done);
                    });
                })
            });
        });
    });

    it('should increase the fan totalVotes and followCount by one', function (done) {
        var fanData = fanMock.getTiniestMock();
        var artistData = artistMock.getTiniestMock();


        var fanObj = null;
        var artistObj = null;
        var songObj = null;
        var voteObj = null;
        Q.allSettled([
            createFan(fanData),
            createArtist(artistData)
        ]).then(function (data) {
            fanObj = data[0].value;
            artistObj = data[1].value;
            server.inject({
                method: 'POST',
                url: '/artists/' + artistObj._id + '/fan',
                payload: JSON.stringify({'_id': fanObj._id, 'type': 'fan'}),
                headers: appJSONHeader
            }, function (res) {
                var voteDate = {
                    "updatedAt" : new Date(),
                    "createdAt" : new Date(),
                    "status" : "pending",
                    "day" : new Date(),
                    "phase" : "np",
                    "contest" : "5391bc6069758716a25bb4a2",// fake
                    "platform" : "desktop",
                    "type" : "purchase",
                    "song" : "53f2cbc25586a05706da5a43", // fake
                    "voter_fan" : fanObj._id,
                    "artist" : artistObj._id,
                    "__v" : 0
                };
                Q.allSettled([createVote(voteDate)])
                .then(function (data) {
                    var vote = data[0].value;
                    server.inject({
                        method: 'GET',
                        url: '/fans/' + fanObj.id + '/stats/count',
                        headers: appJSONHeader
                    }, function (res) {
                        var result = res.result;
                        expect(res.statusCode).to.equal(200);
                        expect(result.followCount).to.equal(1);
                        expect(result.totalVotes).to.equal(1);
                        removeFan({_id: fanObj._id}, function () {
                            removeArtist({_id: artistObj._id}, function () {
                                Vote.remove({_id: vote._id}, function () {
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('should increase the fan projects, totalVotes and followCount by one', function (done) {
        var fanData = fanMock.getTiniestMock();
        var artistData = artistMock.getTiniestMock();
        var paymentData = paymentMock.getTiniestMock();

        var fanObj = null;
        var artistObj = null;
        var voteObj = null;
        Q.allSettled([
            createFan(fanData),
            createArtist(artistData)
        ]).then(function (data) {
            fanObj = data[0].value;
            artistObj = data[1].value;
            server.inject({
                method: 'POST',
                url: '/artists/' + artistObj._id + '/fan',
                payload: JSON.stringify({'_id': fanObj._id, 'type': 'fan'}),
                headers: appJSONHeader
            }, function (res) {
                server.inject({
                    method: "POST",
                    url: "/artists/" + artistObj._id + "/projects",
                    payload: JSON.stringify(projectsMock.getProjectsMock()),
                    headers: appJSONHeader
                }, function (_project) {
                    var project = _project.result;
                    paymentData.target.artist = artistObj._id;
                    paymentData.target.project = _project.result._id;
                    paymentData.source.fan = fanObj._id;

                    var voteDate = {
                        "updatedAt" : new Date(),
                        "createdAt" : new Date(),
                        "status" : "pending",
                        "day" : new Date(),
                        "phase" : "np",
                        "contest" : "5391bc6069758716a25bb4a2",// fake
                        "platform" : "desktop",
                        "type" : "purchase",
                        "song" : "53f2cbc25586a05706da5a43", // fake
                        "voter_fan" : fanObj._id,
                        "artist" : artistObj._id,
                        "__v" : 0
                    };
                    Q.allSettled([
                        createVote(voteDate),
                        createPayment(paymentData)
                        ])
                    .then(function (data) {
                        var vote = data[0].value;
                        var payment = data[1].value;

                        server.inject({
                            method: 'GET',
                            url: '/fans/' + fanObj.id + '/stats/count',
                            headers: appJSONHeader
                        }, function (res) {
                            var result = res.result;
                            expect(res.statusCode).to.equal(200);
                            expect(result.followCount).to.equal(1);
                            expect(result.totalVotes).to.equal(1);
                            removeFan({_id: fanObj._id}, function () {
                                removeArtist({_id: artistObj._id}, function () {
                                    Vote.remove({_id: vote._id}, function () {
                                        Payment.remove({_id : payment._id}, function () {
                                            Project.remove({_id : project._id}, function () {
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('Should return blank array of the artist followed by the fan', function (done) {
        var fanData = fanMock.getTiniestMock();
        var fanObj = null;
        server.inject({
            method: 'POST',
            url: '/fans',
            payload: JSON.stringify(fanData),
            headers: appJSONHeader
        }, function (res) {
            fanObj = res.result;
            server.inject({
                method: 'GET',
                url: '/fans/' + fanObj.id + '/follow',
                headers: appJSONHeader
            }, function (res) {
                var result = res.result;
                expect(res.statusCode).to.equal(200);
                expect(result.artists.length).to.equal(0);
                removeFan({_id: fanObj.id}, done);
            });
        });
    });

    it('Should return array of the artist followed by the fan', function (done) {
        var fanData = fanMock.getTiniestMock();
        var artistData = artistMock.getTiniestMock();

        var fanObj = null;
        var artistObj = null;
        Q.allSettled([
            createFan(fanData),
            createArtist(artistData)
        ]).then(function (data) {
            fanObj = data[0].value;
            artistObj = data[1].value;
            server.inject({
                method: 'POST',
                url: '/artists/' + artistObj._id + '/fan',
                payload: JSON.stringify({'_id': fanObj._id, 'type': 'fan'}),
                headers: appJSONHeader
            }, function (res) {
                expect(res.statusCode).to.equal(200);
                server.inject({
                    method: 'GET',
                    url: '/fans/' + fanObj.id + '/follow',
                    headers: appJSONHeader
                }, function (_artists) {
                    var artists = _artists.result;
                    expect(_artists.statusCode).to.equal(200);
                    expect(artists.artists.length).to.equal(1);
                    removeFan({_id: fanObj._id}, function () {
                        removeArtist({_id: artistObj._id}, done);
                    });
                });
            });
        });
    });

    it('Should return blank array of the favorite artist of fan', function (done) {
        var fanData = fanMock.getTiniestMock();
        var artistData = artistMock.getTiniestMock();

        var fanObj = null;
        var artistObj = null;
        Q.allSettled([
            createFan(fanData),
        ]).then(function (data) {
            fanObj = data[0].value;
            server.inject({
                method: 'GET',
                url: '/fans/' + fanObj.id + '/fan-favorite-artists',
                headers: appJSONHeader
            }, function (_artists) {
                var artists = _artists.result;
                expect(_artists.statusCode).to.equal(200);
                expect(artists.artists.length).to.equal(0);
                removeFan({_id: fanObj._id}, done);
            });
        });
    });
    it('Should return array of the favorite artist of fan', function (done) {
        var fanData = fanMock.getTiniestMock();
        var artistData = artistMock.getTiniestMock();

        var fanObj = null;
        var artistObj = null;
        Q.allSettled([
            createFan(fanData),
            createArtist(artistData)
        ]).then(function (data) {
            fanObj = data[0].value;
            artistObj = data[1].value;
            var voteDate = {
                "updatedAt" : new Date(),
                "createdAt" : new Date(),
                "status" : "pending",
                "day" : new Date(),
                "phase" : "np",
                "contest" : "5391bc6069758716a25bb4a2",// fake
                "platform" : "desktop",
                "type" : "purchase",
                "song" : "53f2cbc25586a05706da5a43", // fake
                "voter_fan" : fanObj._id,
                "artist" : artistObj._id,
                "__v" : 0
            };
            createVote(voteDate)
            .then(function (_vote) {
                var vote = _vote;
                server.inject({
                    method: 'GET',
                    url: '/fans/' + fanObj.id + '/fan-favorite-artists',
                    headers: appJSONHeader
                }, function (_artists) {
                    var artists = _artists.result;
                    expect(_artists.statusCode).to.equal(200);
                    expect(artists.artists.length).to.equal(1);
                    removeFan({_id: fanObj._id}, function () {
                        removeArtist({_id: artistObj._id}, function () {
                            Vote.remove({_id: vote._id}, function () {
                                done();
                            })
                        });
                    });
                });
            });
        });
    });
});
