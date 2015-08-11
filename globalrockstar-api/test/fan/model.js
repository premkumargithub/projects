/* globals describe, it, before, after, beforeEach, afterEach, xdescribe, xit */
'use strict';

var Q = require('q'),
    config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    mongoose = require('mongoose'),
    Fan = mongoose.model('Fan'),
    slug = require('slug'),
    fanMock = require('../mocks/fan'),
    fanMockData = fanMock.getTiniestMock(),
    fan;

describe('Fan Model', function () {
    beforeEach(function (done) {
        fan = new Fan(fanMockData);
        done();
    });

    afterEach(function (done) {
        Fan.remove({_id: fan._id}, function () {
            done();
        });
    });

    it('should fail when saving a duplicate fan', function (done) {
        fan.save(function () {
            var fan2 = new Fan(fanMockData);
            fan2.save(function (err) {
                should.exist(err);
                done();
            });
        });
    });

    it('should fail when saving without an email', function (done) {
        fan.email = '';
        fan.save(function (err) {
            should.exist(err);
            done();
        });
    });

    it('should generate slug from title', function (done) {
        fan.save(function (err, savedFan) {
            should.not.exist(err);
            // FIXME: check why fanObj.state string is seen as an object
            //savedFan.state.should.equal('pending');
            savedFan.slug.should.equal(fanMockData.firstname.toLowerCase() + '-' + fanMockData.lastname.toLowerCase());
            done();
        });
    });

    it('should never change the slug', function (done) {
        fan.save(function (err, savedFan) {
            should.not.exist(err);
            var slug = savedFan.slug;
            savedFan.firstname = "test_name";
            savedFan.save(function (err, updatedFan) {
                should.not.exist(err);
                updatedFan.slug.should.equal(slug);
                done();
            });
        });
    });

    it("should authenticate fan if password is valid", function (done) {
        fan.authenticate(fan.email, function (err, authFan) {
            should.exist(authFan);
            done();
        });
    });

    it("should not authenticate fan if password is invalid", function (done) {
        fan.authenticate("123", function (err, authFan) {
            authFan.should.equal(false);
            done();
        });
    });

    it('should generate a verification token on create', function (done) {

        fan.save(function (err, savedFan) {
            should.not.exist(err);
            should.exist(savedFan.verificationToken);
            done();
        });

    });

    it('should fail when email is not a real email', function (done) {

        fan.email = "not@valid@email";
        fan.save(function (err) {
            console.log(err);
            should.exist(err);
            done();
        });

    });
});
