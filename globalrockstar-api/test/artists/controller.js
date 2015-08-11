/* globals describe, it, xdescribe, xit, before, after, beforeEach, afterEach, xdescribe, xit */
'use strict';
var artistsMock = require('../mocks/artists.js'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Contest = mongoose.model('Contest'),
    Song = mongoose.model('Song'),
    Video = mongoose.model('Video'),
    should = require('should'),
    chai = require('chai'),
    utils = require('../mocks/_utils'),
    artistMock = require('../mocks/artist'),
    contestMock = require('../mocks/contest'),
    songMock = require('../mocks/song'),
    videoMock = require('../mocks/video'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var successCode = Main.successCode,
    obj_data = artistsMock.getArtistMock();


// neede to be implemented in future
var contest_data = {
    "updatedAt": (new Date()).setDate((new Date()).getDate() - 30),
    "createdAt": (new Date()).setDate((new Date()).getDate() + 30),
    "name": "Global Rockstar 2014",
    "webisodeNumber": "123",
    "webisodeTitle": "123",
    "youtubeUrl": "123",
    "finals": {
        "time": {
            "end": (new Date()).setDate((new Date()).getDate() + 30),
        },
        "webisodeNumber": "",
        "youtubeUrl": "https://www.youtube.com/watch?v=6LSzFiGBpno",
        "content": "<div class=\"grid text--center\">\r\n<div class=\"grid__item one-third lap-one-half palm-one-whole push--bottom\">\r\n<div class=\"box box--select\">\r\n<div class=\"box__content\">\r\n<h2 class=\"box__headline\"><span class=\"icon icon__plectrum--love\"></span><br />\r\n<span>Artist of the Day</span></h2>\r\n\r\n<p class=\"push-half--bottom\">Global Rockstar picks one outstanding&nbsp;<br />\r\nArtist every day<br />\r\n<br />\r\nIf we pick you, we post your song&nbsp;<br />\r\non our facebook page<br />\r\n<br />\r\nGet the most comments and become&nbsp;<br />\r\nArtist of the Week!</p>\r\n</div>\r\n\r\n<div class=\"box__footer\"><a class=\"btn btn--blue btn--wide\" href=\"https://www.facebook.com/TheGlobalRockstar\">#AOTD</a></div>\r\n</div>\r\n</div>\r\n\r\n<div class=\"grid__item one-third lap-one-half palm-one-whole push--bottom\">\r\n<div class=\"box box--select\">\r\n<div class=\"box__content\">\r\n<h2 class=\"box__headline\"><span class=\"icon icon__plectrum--vip\"></span><br />\r\n<span></span><span>Artist of the Week</span></h2>\r\n\r\n<p class=\"push-half--bottom\">We picked you as Artist of the Day?<br />\r\nNow, activate your Fans!<br />\r\n<br />\r\nGet the most comments on&nbsp;<br />\r\nthe Global Rockstar facebook page<br />\r\n<br />\r\nYou become Artist of the Week<br />\r\nand a great AKG P5 is yours!</p>\r\n</div>\r\n\r\n<div class=\"box__footer\"><a class=\"btn btn--blue btn--wide\" href=\"/rules\">#AOTW</a></div>\r\n</div>\r\n</div>\r\n\r\n<div class=\"grid__item one-third lap-one-half palm-one-whole push--bottom\">\r\n<div class=\"box box--select\">\r\n<div class=\"box__content\">\r\n<h2 class=\"box__headline\"><span class=\"icon icon__plectrum--winner\"></span><br />\r\n<span></span><span>Artist of the Month</span></h2>\r\n\r\n<p class=\"push-half--bottom\">You won the Artist of the Week?<br />\r\nNow our jury decides<br />\r\n<br />\r\nFrom 4 Artists of the Week<br />\r\nGlobal Rockstar picks a winner<br />\r\n<br />\r\nThe Artists of the Month<br />\r\nwin an AKG WMS 420 system!</p>\r\n</div>\r\n\r\n<div class=\"box__footer\"><a class=\"btn btn--blue btn--wide\" href=\"/rules\">#AOTM</a></div>\r\n</div>\r\n</div>\r\n</div>\r\n"
    },
    "globalfinalsBest16": {
        "time": {
            "start": (new Date()).setDate((new Date()).getDate() - 30),
            "end": (new Date()).setDate((new Date()).getDate() + 30),
        },
        "webisodeNumber": "123",
        "webisodeTitle": "123",
        "content": "123",
        "youtubeUrl": "123"
    },
    "globalfinalsBest64": {
        "time": {
            "start": (new Date()).setDate((new Date()).getDate() - 30),
            "end": (new Date()).setDate((new Date()).getDate() + 30),
        },
        "webisodeNumber": "123",
        "webisodeTitle": "123",
        "content": "123",
        "youtubeUrl": "123"
    },
    "globalfinalsQualification": {
        "time": {
            "start": (new Date()).setDate((new Date()).getDate() - 30),
            "end": (new Date()).setDate((new Date()).getDate() + 30),
        },
        "webisodeNumber": "123",
        "webisodeTitle": "123",
        "content": "123",
        "youtubeUrl": "123"
    },
    "np": {
        "time": {
            "start": (new Date()).setDate((new Date()).getDate() - 30),
            "end": (new Date()).setDate((new Date()).getDate() + 30),
        }
    },
    "cfe": {
        "time": {
            "start": (new Date()).setDate((new Date()).getDate() - 30),
            "end": (new Date()).setDate((new Date()).getDate() + 30),
        }
    },
    "contestTicker": false
};
var contest_id = null;


describe('Artists API tests:', function () {

    //// Todo
    //before(function (done) {
    //    var contest = new Contest(contest_data);
    //    contest.save(function (err, contest) {})
    //    contest_id = contest.id;
    //    done();
    //});
    //
    //// Todo
    //after(function (done) {
    //    Contest.remove({_id: contest_id}, function () {
    //        done();
    //    });
    //})

    var removeArtist = function (id, done) {
        Artist.remove({_id: id}, function () {
            done();
        });
    };

    it('Should create and mark as active/update an artist', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;

            var pid = res.result.id;
            server.inject({
                method: "PUT",
                url: "/artists/" + pid,
                payload: JSON.stringify(artistsMock.updateArtist()),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                var result = JSON.parse(res.payload);
                var expected = artistsMock.getExpectedMock();
                if (!Main.validateTwoObjects(expected, result)) throw err;
                removeArtist(artistObj.id, done);
            });
        });
    });

    it('should create an artist with facebook ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(artistsMock.getfacebookUserMock()),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            removeArtist(artistObj.id, done);
        });
    });

    it('should authenticate facebook artist user ', function (done) {
        var facebookCreate = artistsMock.getfacebookUserMock();
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(facebookCreate),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var opts = {
                facebookId: facebookCreate.facebookId,
                email: facebookCreate.email,
                name: facebookCreate.name
            };
            server.inject({
                method: "POST",
                url: "/artists/facebook_authenticate",
                payload: JSON.stringify(opts),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                removeArtist(artistObj.id, done);
            });
        });
    });

    it('should create an artist and get its detail infos ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var pid = res.result.id;
            server.inject({
                method: "GET",
                url: "/artists/" + pid
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                var result = JSON.parse(res.payload);
                var expected = artistsMock.getExpectedMock();
                if (!Main.validateTwoObjects(expected, result)) throw err;
                removeArtist(artistObj.id, done);
            })
        });
    });

    it('should delete an artist ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var pid = res.result.id;
            server.inject({
                method: "DELETE",
                url: "/artists/" + pid
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                removeArtist(artistObj.id, done);
            })
        });
    });

    it('should delete an artist ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var pid = res.result.id;
            server.inject({
                method: "DELETE",
                url: "/artists/" + pid
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                done();
            })
        });
    });

    it('should authenticate an artist ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var opts = {};
            opts.email = obj_data.email;
            opts.password = obj_data.password;
            server.inject({
                method: "POST",
                url: "/artist/authenticate",
                payload: JSON.stringify(opts),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                removeArtist(artistObj.id, done);
            })
        });
    });

    it('should update password for an artist ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var pid = res.result.id;
            server.inject({
                method: "PUT",
                url: "/artists/" + pid + "/password",
                payload: JSON.stringify(artistsMock.getChangedPassword()),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                removeArtist(artistObj.id, done);
            });
        });
    });
    it('should get the detail of the artist ', function (done) {
        var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        obj_data.name = username + 'Artist';
        obj_data.email = username + 'Artist@artist.com'
        server.inject({
            method: 'POST',
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var pid = res.result.id;
            server.inject({
                method: "GET",
                url: "/artists/" + artistObj.slug + "/detail",
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                var artistsDetail = JSON.parse(res.payload);
                var expected = artistsMock.getArtistDetial;
                if (!Main.validateTwoObjects(expected, artistsDetail)) throw err;
                res.should.have.property('payload');
                removeArtist(artistObj.id, done);
            })
        });
    });
    it('should get the statistics of the artist ', function (done) {
        var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        obj_data.name = username + 'Artist';
        obj_data.email = username + 'Artist@artist.com'
        server.inject({
            method: 'POST',
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var pid = res.result.id;
            server.inject({
                method: "GET",
                url: "/artists/" + artistObj.slug + "/statistics",
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                var artistsStatistics = JSON.parse(res.payload);
                var expected = artistsMock.getArtistStatistics;
                if (!Main.validateTwoObjects(expected, artistsStatistics)) throw err;
                res.should.have.property('payload');
                removeArtist(artistObj.id, done);
            })
        });
    });

    it('should increase the fan count by one ', function (done) {
        var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        obj_data.name = username + 'Artist';
        obj_data.email = username + 'Artist@artist.com'
        server.inject({
            method: 'POST',
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            var artistObj1 = JSON.parse(res.payload);
            //console.log('artistObj1', artistObj1)
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj1)) throw err;
            var pid1 = res.result.id;
            var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            obj_data.name = username + 'Artist';
            obj_data.email = username + 'Artist@artist.com'
            server.inject({
                method: 'POST',
                url: "/artists",
                payload: JSON.stringify(obj_data),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                var artistObj2 = JSON.parse(res.payload);
                //console.log('artistObj2', artistObj2)
                var expected = artistsMock.createAfterMock();
                if (!Main.validateTwoObjects(expected, artistObj2)) throw err;
                var pid2 = res.result.id;
                server.inject({
                    method: "POST",
                    url: "/artists/" + artistObj1.id + "/fan",
                    payload: JSON.stringify({'_id': artistObj2.id, 'type': 'artist'}),
                    headers: {'Content-Type': 'application/json'}
                }, function (res) {
                    expect(res.statusCode).to.equal(successCode);
                    var artistsFan = JSON.parse(res.payload);
                    expect(artistsFan.fanCount).to.equal(1);
                    res.should.have.property('payload');
                    Artist.remove({_id: artistObj1.id}, function () {
                        removeArtist(artistObj2.id, done);
                    });
                })
            });
        });
    });
    it("should associate contestMedia to a contest if media is not already associated to another contest", function (done) {

        utils.inject('POST', '/artists', artistMock.getTiniestMock(), function (statusCode, artist, res) {
            utils.inject('POST', '/contests', contestMock.getMock(), function (statusCode, oldContest, res) {

                var songsUrl = '/artists/' + artist.id + '/songs';
                utils.inject('POST', songsUrl, songMock.getTiniestMock(), function (statusCode, song1, res) {

                    // song2 is associated to oldContest
                    var song2Data = songMock.getTiniestMock();
                    song2Data.contest = oldContest._id;

                    utils.inject('POST', songsUrl, song2Data, function (statusCode, song2, res) {

                        var videoData = videoMock.getTiniestYoutubeMock(artist.id);
                        utils.inject('POST', '/videos/youtube', videoData, function (statusCode, video, res) {

                            var url = '/artists/' + artist.id + '/contest-media',
                                payload = {contestMedia: song1._id, contestMediaType: 'song'};

                            // Associate song1 to user as contestMedia
                            utils.inject('PUT', url, payload, function (statusCode, editedArtist, res) {

                                expect(statusCode).to.equal(200);
                                expect(editedArtist.contestMedia._id).to.equal(song1._id);
                                expect(editedArtist.contestMediaType).to.equal('song');

                                var payload = {contestMedia: song2._id, contestMediaType: 'song'};

                                // Try to associate song2 to user as contestMedia
                                utils.inject('PUT', url, payload, function (statusCode, editedArtist, res) {

                                    expect(statusCode).to.equal(400);

                                    var payload = {contestMedia: video._id, contestMediaType: 'video'}

                                    // Associate video to user as contestMedia
                                    utils.inject('PUT', url, payload, function (statusCode, editedArtist, res) {

                                        expect(statusCode).to.equal(200);
                                        expect(editedArtist.contestMedia._id).to.equal(video._id);
                                        expect(editedArtist.contestMediaType).to.equal('video');

                                        utils.inject('GET', '/songs/' + song1._id, function (statusCode, editedSong1, res) {
                                            utils.inject('GET', '/videos/' + video._id, function (statusCode, editedVideo, res) {

                                                expect(editedSong1.contest).to.be.undefined();
                                                expect(editedVideo.contest._id).to.not.be.undefined();

                                                utils.removeEntry(Artist, artist.id, function () {
                                                    utils.removeEntry(Contest, oldContest._id, function () {
                                                        utils.removeEntry(Song, song1._id, function () {
                                                            utils.removeEntry(Song, song2._id, function () {
                                                                utils.removeEntry(Video, video._id, done);
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
                });
            });
        });
    });


    it("should associate a preferred media to the user profile", function (done) {

        utils.inject('POST', '/artists', artistMock.getTiniestMock(), function (statusCode, artist, res) {

            var songsUrl = '/artists/' + artist.id + '/songs';
            utils.inject('POST', songsUrl, songMock.getTiniestMock(), function (statusCode, song, res) {

                var videoData = videoMock.getTiniestYoutubeMock(artist.id);
                utils.inject('POST', '/videos/youtube', videoData, function (statusCode, video, res) {

                    var url = '/artists/' + artist.id + '/preferred-media',
                        payload = {preferredMedia: song._id, preferredMediaType: 'song'};

                    // Associate song to user as preferred media
                    utils.inject('PUT', url, payload, function (statusCode, editedArtist, res) {
                        expect(statusCode).to.equal(200);
                        expect(editedArtist.preferredMedia._id).to.equal(song._id);
                        expect(editedArtist.preferredMediaType).to.equal('song');

                        utils.inject('GET', '/artists/' + artist.id, function (statusCode, retrievedArtist, res) {

                            expect(retrievedArtist.preferredMedia).to.equal(song._id);
                            expect(retrievedArtist.preferredMediaType).to.equal('song');

                            var payload = {preferredMedia: video._id, preferredMediaType: 'video'};

                            // Associate video to user as preferredMedia
                            utils.inject('PUT', url, payload, function (statusCode, editedArtist, res) {

                                expect(statusCode).to.equal(200);
                                expect(editedArtist.preferredMedia._id).to.equal(video._id);
                                expect(editedArtist.preferredMediaType).to.equal('video');

                                utils.inject('GET', '/artists/' + artist.id, function (statusCode, retrievedArtist2, res) {
                                    expect(retrievedArtist2.preferredMedia).to.equal(video._id);
                                    expect(retrievedArtist2.preferredMediaType).to.equal('video');

                                    utils.removeEntry(Artist, artist.id, function () {
                                        utils.removeEntry(Song, song._id, function () {
                                            utils.removeEntry(Video, video._id, done);
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

    it('should return the song and video of the artist ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var artistObj = JSON.parse(res.payload);
            var expected = artistsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;
            var pid = res.result.id;
            server.inject({
                method: "POST",
                url: '/artists/' + artistObj.id + '/songs',
                payload : songMock.getTiniestMock(),
                headers: {'Content-Type': 'application/json'}
            }, function (res) {
                var songObj = JSON.parse(res.payload);
                var videoData = videoMock.getTiniestYoutubeMock(artistObj.id);
                server.inject({
                    method: "POST",
                    url: '/videos/youtube',
                    payload : videoData,
                    headers: {'Content-Type': 'application/json'}
                }, function (res) {
                    var videoObj = JSON.parse(res.payload);
                    server.inject({
                        method: "GET",
                        url: '/artists/' + artistObj.id + '/media',
                        headers: {'Content-Type': 'application/json'}
                    }, function (res) {
                        expect(res.statusCode).to.equal(successCode);
                        res.should.have.property('payload');
                        var result = JSON.parse(res.payload);
                        expect(result.songLength).to.equal(1);
                        expect(result.videoLength).to.equal(1);
                        Song.remove({_id: songObj.id}, function () {
                            Video.remove({_id : videoObj.id}, function () {
                                removeArtist(artistObj.id, done);
                            });
                        });
                    });
                });
            });
        });
    });
});


