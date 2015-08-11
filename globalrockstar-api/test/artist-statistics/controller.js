'use strict';
var artitsMock = require('../mocks/artists.js'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Content = mongoose.model('Content'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var successCode = Main.successCode,
    obj_data = artitsMock.getArtistMock();

describe('Artists-Statistics API tests:', function () {
    it('should return all statistics about an artist', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var result = JSON.parse(res.payload);
            var expected = artitsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, result)) throw err;
            var options = {
                method: "GET",
                url: "/artists/" + result.slug + "/statistics"
            };
            server.inject(options, function (res) {
                expect(res.statusCode).to.equal(successCode);
                var result = JSON.parse(res.payload);
                result.should.have.property('artiststat');
                result.should.have.property('projects');
                done();
            });
        });
    });
});


