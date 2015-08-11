/* globals xit, xdescribe, describe, it, before, beforeEach, after, afterEach */
'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Video = mongoose.model('Video'),
    Artist = mongoose.model('Artist'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    videoMock = require('../mocks/video'),
    artistMock = require('../mocks/artist'),
    server = require('../../server');


describe('Video Model', function () {

    it('should save a video uploaded directly on Global Rockstar', function (done) {

        var artist = new Artist(artistMock.getTiniestMock());
        artist.save(function (err, artistInstance) {
            var video = new Video(videoMock.getTiniestUploadMock(artistInstance.id));
            video.save(function (err, videoInstance) {

                expect(videoInstance.title).to.equal(video.title);
                expect(videoInstance.originalSource).to.equal(video.originalSource);
                expect(videoInstance.artist).to.equal(video.artist);

                Video.remove({_id: videoInstance.id}, function (err) {
                    done();
                });
            });
        });
    });

    it('should save a video fetched from youtube', function (done) {

        var artist = new Artist(artistMock.getTiniestMock());
        artist.save(function (err, artistInstance) {
            var video = new Video(videoMock.getTiniestYoutubeMock(artistInstance.id));
            video.save(function (err, videoInstance) {

                expect(videoInstance.title).to.equal(video.title);
                expect(videoInstance.originalSource).to.equal(video.originalSource);
                expect(videoInstance.artist).to.equal(video.artist);
                expect(videoInstance.youtubeURL).to.equal(video.youtubeURL);

                Video.remove({_id: videoInstance.id}, function (err) {
                    done();
                });
            });
        });
    });
});







// TODO: implement these tests when YT API will be working

//it('should not allow save with duplicate youtubeUrl', function (done) {
//    var songSaved = false;
//    Q.ninvoke(song, 'save')
//        .then(function (song) {
//            songSaved = true;
//            var song2 = new Song(songData);
//            return Q.ninvoke(song2, 'save');
//        })
//        .then(function () {
//            done(new Error('This should have failed!'));
//        })
//        .fail(function () {
//            if (songSaved) done();
//            else done(new Error('Save of first song failed!'));
//        });
//});
//
//it('should prefix url with http automatically', function (done) {
//    song.itunesUrl = "notyce.net";
//    song.save(function (err, obj) {
//        should.not.exist(err);
//        obj.itunesUrl.should.equal("http://notyce.net");
//        done();
//    });
//});
//
//it('should validate youtube url', function (done) {
//    song.youtubeUrl = 'http://www.vimeo.com';
//    song.save(function (err, obj) {
//        should.exist(err);
//        done();
//    });
//});
//
//it('should get youtube meta information', function (done) {
//    var youtubeUrl = 'http://www.youtube.com/watch?v=9GkVhgIeGJQ';
//    song.loadYoutubeMeta(youtubeUrl, function (err, obj) {
//        expect(obj.youtube.id).to.equal('9GkVhgIeGJQ');
//        expect(obj.youtube.duration).to.equal(175);
//        expect(obj.youtube.uploader).to.equal('thecurevevo');
//        expect(obj.youtube.thumbnails.length).to.equal(2);
//        done();
//    });
//});
//
//it('should validate unique youtubeUrl with scope artist', function (done) {
//    var oid = ObjectId();
//    song.artist = oid;
//    song.youtubeUrl = 'http://www.youtube.com/watch?v=9GkVhgIeGJQ';
//    song.save(function (err, song1) {
//        expect(err).to.not.exist;
//
//        var song2 = new Song({
//            youtubeUrl: 'http://www.youtube.com/watch?v=9GkVhgIeGJQ',
//            title: 'some song title',
//            audiofile: 'some file url',
//            tags: ['some', 'cool', 'genres'],
//            copyright_lyrics: 'lyric copyright text',
//            copyright_music: 'music copyright text',
//            copyright_publisher: 'publisher copyright text',
//            sponsoring: false,
//            artist: song.artist,
//            reward: false,
//        });
//        song2.artist = oid;
//
//        song2.save(function (err, song2) {
//            expect(err).to.exist;
//            console.log(err);
//            done();
//
//        });
//    });
//});