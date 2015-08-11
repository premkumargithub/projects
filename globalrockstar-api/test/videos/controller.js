/* globals describe, it, xdescribe, xit, before, after, beforeEach, afterEach, xdescribe, xit */
'use strict';

var should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    models = require('../../models'),
    config = require('../../lib/database'),
    mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Contest = mongoose.model('Contest'),
    Video = mongoose.model('Video'),
    Q = require('q'),
    utils = require('../mocks/_utils'),
    videoMock = require('../mocks/video'),
    artistMock = require('../mocks/artist'),
    contestMock = require('../mocks/contest'),
    server = require('../../index'),
    genres = require('../../public/configs/genres.json'),
    createArtist = Q.nbind(Artist.create, Artist),
    createContest = Q.nbind(Contest.create, Contest),
    youtubeVideoInstance,
    globalrockstarVideoInstance,
    artistInstance,
    contestInstance;

describe('REST API for videos', function () {

    beforeEach(function (done) {
        createArtist(artistMock.getTiniestMock()).then(function (data) {
            artistInstance = data;
            var youtubeVideoData = videoMock.getYoutubeMock(artistInstance._id),
                globalrockstarVideoData = videoMock.getUploadMock(artistInstance._id);

            createContest(contestMock.getMock()).then(function (data) {
                contestInstance = data;

                utils.inject('POST', '/videos/youtube', youtubeVideoData, function (s, j, res) {
                    youtubeVideoInstance = res.result;
                    utils.inject('POST', '/videos/globalrockstar', globalrockstarVideoData, function (s, j, res) {
                        globalrockstarVideoInstance = res.result;
                        done();
                    });
                });
            });
        });
    });

    afterEach(function (done) {
        utils.removeEntry(Artist, artistInstance.id, function () {
            utils.removeEntry(Contest, contestInstance.id, function () {
                utils.removeEntry(Video, youtubeVideoInstance.id, function () {
                    utils.removeEntry(Video, globalrockstarVideoInstance.id, done);
                });
            });
        });
    });

    describe('GET requests', function () {

        // TODO: This is too heavy to execute. Find a good replacement
        xit('should reply with 200', function (done) {
            utils.inject('GET', '/videos', function (statusCode, jsonResponse, res) {
                console.log(statusCode);
                expect(statusCode).to.equal(200);
                done();
            });
        });

        // TODO: This is too heavy to execute. Find a good replacement
        xit('should retrieve one youtube video and one globalrockstar video', function (done) {
            utils.inject('GET', '/videos', function (statusCode, jsonResponse) {
                var youtubeVideo = jsonResponse.filter(function (video) {
                    return video._id === youtubeVideoInstance.id;
                });
                expect(youtubeVideo.length).to.equal(1);
                expect(youtubeVideo[0].title).to.equal(youtubeVideoInstance.title);
                expect(youtubeVideo[0].artist._id).to.equal(artistInstance.id);
                expect(youtubeVideo[0].artist.slug).to.equal(artistInstance.slug);
                expect(youtubeVideo[0].artist.name).to.equal(artistInstance.name);

                var globalrockstarVideo = jsonResponse.filter(function (video) {
                    return video._id === globalrockstarVideoInstance.id;
                });
                expect(globalrockstarVideo.length).to.equal(1);
                expect(globalrockstarVideo[0].title).to.equal(globalrockstarVideoInstance.title);

                done();
            });
        });

        it('should retrieve videos of a specific artist', function (done) {
            utils.inject('GET', '/artists/' + artistInstance.id + '/videos', function (statusCode, jsonResponse) {
                var videosOfArtist = jsonResponse.filter(function (video) {
                    return video.artist._id === artistInstance.id;
                });
                expect(videosOfArtist[0].artist._id).to.equal(artistInstance.id);
                expect(videosOfArtist[0].artist.slug).to.equal(artistInstance.slug);
                expect(videosOfArtist[0].artist.name).to.equal(artistInstance.name);
                done();
            });
        });

        it('should also retrieve details about contest', function (done) {
            utils.inject('GET', '/videos/' + youtubeVideoInstance.id, function (statusCode, video) {
                video.contest = contestInstance._id;
                utils.inject('PUT', '/videos/youtube/' + video._id, video, function (statusCode, jsonResponse) {
                    utils.inject('GET', '/videos/' + youtubeVideoInstance.id, function (statusCode, jsonResponse) {
                        expect(jsonResponse.contest._id).to.equal(contestInstance.id);
                        expect(jsonResponse.contest.name).to.equal(contestInstance.name);
                        done();
                    });
                });
            });
        });
    });

    describe('POST requests', function () {
        it('should let me add a new youtube video with the smallest amount of information', function (done) {
            var videoData = videoMock.getTiniestYoutubeMock(artistInstance._id);

            utils.inject('POST', '/videos/youtube', videoData, function (statusCode, jsonPayload, res) {

                expect(statusCode).to.equal(201);
                expect(jsonPayload.artist._id).to.equal(artistInstance.id);
                expect(jsonPayload.title).to.equal(videoData.title);
                expect(jsonPayload.youtubeURL).to.equal(videoData.youtubeURL);
                expect(jsonPayload.originalSource).to.equal(videoData.originalSource);
                utils.removeEntry(Video, res.result.id, done);
            });
        });


        it('should let me add a new globalrockstar video with the smallest amount of information', function (done) {
            var videoData = videoMock.getTiniestUploadMock(artistInstance._id);

            utils.inject('POST', '/videos/globalrockstar', videoData, function (statusCode, jsonPayload, res) {

                expect(statusCode).to.equal(201);
                expect(jsonPayload.artist._id).to.equal(artistInstance.id);
                expect(jsonPayload.title).to.equal(videoData.title);
                expect(jsonPayload.originalSource).to.equal(videoData.originalSource);
                utils.removeEntry(Video, res.result.id, done);
            });
        });
    });

    describe('PUT requests', function () {
        it('should let me edit a youtube video changing the youtube url', function (done) {
            var newVideoUrl = 'https://www.youtube.com/watch?v=wRXOf-9YJU0';
            youtubeVideoInstance.youtubeURL = newVideoUrl;

            utils.inject('PUT', '/videos/youtube/' + youtubeVideoInstance.id,
                youtubeVideoInstance, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload.artist._id).to.equal(artistInstance.id);
                    expect(jsonPayload.title).to.equal(youtubeVideoInstance.title);
                    expect(jsonPayload.youtubeURL).to.equal(newVideoUrl);
                    done();
                });
        });

        it('should let me edit a globalrockstar video changing the title and genres', function (done) {
            var newTitle = 'A NEW TITLE',
                newGenres = [genres[0], genres[1]];

            globalrockstarVideoInstance.title = newTitle;
            globalrockstarVideoInstance.genres = newGenres;

            utils.inject('PUT', '/videos/globalrockstar/' + globalrockstarVideoInstance.id,
                globalrockstarVideoInstance, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload.artist._id).to.equal(artistInstance.id);
                    expect(jsonPayload.title).to.equal(newTitle);
                    expect(jsonPayload.genres).to.eql(newGenres);
                    done();
                });
        });

        it('should let me edit a globalrockstar video adding contest info', function (done) {

            var videoId = globalrockstarVideoInstance.id;

            globalrockstarVideoInstance.contest = contestInstance._id;

            utils.inject('PUT', '/videos/globalrockstar/' + videoId,
                globalrockstarVideoInstance, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    expect(jsonPayload.contest._id).to.equal(contestInstance.id);
                    done();
                });
        });

        it('should not let me edit a youtube video changing originalSource or videoFile', function (done) {
            var originalSourceOriginalValue = youtubeVideoInstance.originalSource,
                originalVideoFileValue = youtubeVideoInstance.videoFile;

            youtubeVideoInstance.originalSource = "gloablrockstar";
            youtubeVideoInstance.videoFile = "update_url";

            utils.inject('PUT', '/videos/globalrockstar/' + youtubeVideoInstance.id,
                youtubeVideoInstance, function (statusCode, jsonPayload, res) {
                    expect(jsonPayload.originalSource).to.equal(originalSourceOriginalValue);
                    expect(jsonPayload.videoFile).to.equal(originalVideoFileValue);
                    done();
                });
        });


        it('should not let me edit a globalrockstar video changing originalSource or videoFile', function (done) {
            var originalSourceOriginalValue = globalrockstarVideoInstance.originalSource,
                originalVideoFileValue = globalrockstarVideoInstance.videoFile;

            globalrockstarVideoInstance.originalSource = "youtube";
            globalrockstarVideoInstance.videoFile = "update_url";

            utils.inject('PUT', '/videos/globalrockstar/' + globalrockstarVideoInstance.id,
                globalrockstarVideoInstance, function (statusCode, jsonPayload, res) {
                    expect(jsonPayload.originalSource).to.equal(originalSourceOriginalValue);
                    expect(jsonPayload.videoFile).to.equal(originalVideoFileValue);
                    done();
                });
        });
    });

    describe('DELETE requests', function () {
        it('should let me delete a youtube video', function (done) {
            var videoData = videoMock.getTiniestYoutubeMock(artistInstance._id);

            utils.inject('POST', '/videos/youtube', videoData, function (statusCode, jsonPayload, res) {
                var docId = jsonPayload._id;
                utils.inject('DELETE', '/videos/youtube/' + docId, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    utils.inject('GET', '/videos/youtube/' + docId, function (statusCode, jsonPayload, res) {
                        expect(statusCode).to.equal(404);
                        done();
                    });
                });
            });
        });

        it('should let me delete a globalrockstar video', function (done) {
            var videoData = videoMock.getTiniestUploadMock(artistInstance._id);

            utils.inject('POST', '/videos/globalrockstar', videoData, function (statusCode, jsonPayload, res) {
                var docId = jsonPayload._id;
                utils.inject('DELETE', '/videos/globalrockstar/' + docId, function (statusCode, jsonPayload, res) {
                    expect(statusCode).to.equal(200);
                    utils.inject('GET', '/videos/globalrockstar/' + docId, function (statusCode, jsonPayload, res) {
                        expect(statusCode).to.equal(404);
                        done();
                    });
                });
            });
        });
    });
});
