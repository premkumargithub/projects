'use strict';
var activityMock = require('../mocks/activities'),
    artitsMock = require('../mocks/artists'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Activity = mongoose.model('Activity'),
    Artist = mongoose.model('Artist'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var successCode = Main.successCode,
    activityExpected = activityMock.createAfterMock(),
    replyExpected = activityMock.createAfterReply(),
    userObj,
    artistObj,
    activityObj,
    replyObj;
    
describe('Activity API tests:', function () {

    var removeActivity = function (id) {
        Activity.remove({_id: id}, function () {
            return;
        });
    };

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

    it('Should create activity: become a fane for an artist', function (done) {
        var opts = {
            artistId: userObj.id,
            country: "IN",
            activity: {
                type: "become_fan",
                user: artistObj.id,
                userType: "fan or artist"
            }
        };
        var options = {
            method: "POST",
            url: "/activities",
            payload: JSON.stringify(opts),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            activityObj = JSON.parse(res.payload);

            expect(activityObj.artist._id).to.equal(userObj.id);
            expect(activityObj.activity.type).to.equal(opts.activity.type);
            expect(activityObj.activity.artist).to.equal(opts.activity.artist);
            if (!Main.validateTwoObjects(activityExpected, activityObj)) throw err;
            done();
        });
    });

    it('Should reply on a activity by an artist only', function (done) {
        var opts = {
            userId: artistObj.id,
            userType: "artist or fan",
            message: "Good to a fan"
        };
        var options = {
            method: "POST",
            url: "/activities/" + activityObj._id + "/replies",
            payload: JSON.stringify(opts),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            replyObj = JSON.parse(res.payload);
            if (!Main.validateTwoObjects(replyExpected, replyObj)) throw err;

            done();
        });
    });

    it('Should remove reply from a activity by an artist only', function (done) {
        var options = {
            method: "DELETE",
            url: "/activities/" + activityObj._id + "/replies/" + replyObj._id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            done();
        });
    });

    it('Should flag an activity by admin only', function (done) {
        var opts = {
            userId: artistObj.id,
            type: "fans or offens"
        };
        var options = {
            method: "POST",
            url: "/activities/" + activityObj._id + "/flags",
            payload: JSON.stringify(opts),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should flag on a reply for activity by an admin only', function (done) {
        var opts = {
            userId: userObj.id,
            type: "fans or offens"
        };
        var options = {
            method: "POST",
            url: "/activities/" + activityObj._id + "/replies/" + replyObj._id + "/flags",
            payload: JSON.stringify(opts),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            done();
        });
    });

    it('Should return the activity list for an user', function (done) {
        var options = {
            method: "GET",
            url: "/activities/" + userObj.id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var activityObj1 = JSON.parse(res.payload);
            activityObj1.should.have.property('total');
            activityObj1.should.have.property('results');
            if (activityObj1.total && !Main.validateTwoObjects(activityExpected, activityObj1.results[0])) throw err;
            done();
        });
    });

    it('Should remove activity', function (done) {
        var options = {
            method: "DELETE",
            url: "/activities/" + activityObj._id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            //removeActivity(activityObj._id);
            removeUser(userObj.id);
            removeUser(artistObj.id);
            done();
        });
    });

});
