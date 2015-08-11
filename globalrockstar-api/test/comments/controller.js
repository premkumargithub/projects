'use strict';
var commentMock = require('../mocks/comments'),
    artitsMock = require('../mocks/artists'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Comment = mongoose.model('Comment'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var successCode = Main.successCode,
    obj_data = commentMock.getCommentMock(),
    reply_data = commentMock.getReplyMock(),
    userObj,
    artistObj,
    commentObj,
    replyObj;
 
describe('Comments API tests:', function () {

    var removeUser = function (id) {
        Artist.remove({_id: id}, function () {
            return;
        });
    };

    it('Should create a user and an artist ', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(artitsMock.getArtistMock()),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            artistObj = JSON.parse(res.payload);
            var expected = artitsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;

            //create an artist 
            var options = {
                method: "POST",
                url: "/artists",
                payload: JSON.stringify(artitsMock.getArtistMock()),
                headers: { 'Content-Type': 'application/json' }
            };
            server.inject(options, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.should.have.property('payload');
                userObj = JSON.parse(res.payload);
                var expected = artitsMock.createAfterMock();
                if (!Main.validateTwoObjects(expected, userObj)) throw err;
                
                done();
            });
        });
    });

    it('Should create comment on an artist profile', function (done) {
        obj_data.artistId = artistObj.id;
        obj_data.userId = userObj.id;
        var options = {
            method: "POST",
            url: "/comments",
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            commentObj = JSON.parse(res.payload);
            expect(commentObj.artist._id).to.equal(artistObj.id);
            expect(commentObj.user._id).to.equal(userObj.id);
            expect(commentObj.message).to.equal(obj_data.message);
            expect(commentObj.country).to.equal(obj_data.country);
            var expected = commentMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, commentObj)) throw err;
            
            done();
        });
    });

    it('Should return comments list on an artist profile', function (done) {
        var options = {
            method: "GET",
            url: "/comments/" + artistObj.id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var commentObj1 = JSON.parse(res.payload);
            var expected = commentMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, commentObj1.results[0])) throw err;
            
            done();
        });
    });

    it('Should like a comment on an artist profile', function (done) {
        var opts = {};
        opts.userId = userObj.id;
        var options = {
            method: "POST",
            payload: JSON.stringify(opts),
            url: "/comments/" + commentObj._id + "/likes",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should unlike a comment on an artist profile', function (done) {
        var options = {
            method: "DELETE",
            url: "/comments/" + commentObj._id + "/likes/" + userObj.id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should flag a comment on an artist profile', function (done) {
        var data = {};
        data.userId = userObj.id;
        data.type = "fans";
        var options = {
            method: "POST",
            url: "/comments/" + commentObj._id + "/flags",
            payload: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should reply on a comment on an artist profile', function (done) {
        var data = {};
        data.userId = userObj.id;
        data.userType = "artist";
        data.message = reply_data.message;
        var options = {
            method: "POST",
            url: "/comments/" + commentObj._id + "/replies",
            payload: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            replyObj = JSON.parse(res.payload);
            var expected = commentMock.createAfterReply();
            if (!Main.validateTwoObjects(expected, replyObj)) throw err;

            done();
        });
    });

    it('Should like a reply on a comment for an artist profile', function (done) {
        var opts = {};
        opts.userId = userObj.id;
        var options = {
            method: "POST",
            payload: JSON.stringify(opts),
            url: "/comments/" + commentObj._id + "/reply/" + replyObj._id + "/likes",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should unlike a reply on a comment for an artist profile', function (done) {
        var options = {
            method: "DELETE",
            url: "/comments/" + commentObj._id + "/reply/" + replyObj._id + "/likes/" + userObj.id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should flag a reply on comment on an artist profile', function (done) {
        var data = {};
        data.userId = userObj.id;
        data.type = "fans";
        var options = {
            method: "POST",
            url: "/comments/" + commentObj._id + "/replies/" + replyObj._id + "/flags",
            payload: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should remove reply from a comment on an artist profile', function (done) {
        var options = {
            method: "DELETE",
            url: "/comments/" + commentObj._id + "/replies/" + replyObj._id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');

            done();
        });
    });

    it('Should remove a comment from an artist profile', function (done) {
        var options = {
            method: "DELETE",
            url: "/comments/" + commentObj._id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            removeUser(userObj.id);
            removeUser(artistObj.id);
            done();
        });
    });
});
