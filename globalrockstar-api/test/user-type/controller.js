'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Fan = mongoose.model('Fan'),
    Q = require('q'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    fanMock = require('../mocks/fan'),
    server = require('../../index');

var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

var artist_data = {
    name: "some name",
    email: username + "@host.com",
    country : "AT",
    password: "123456789",
    password_confirmation: "123456789",
    toc: true,
    newsletter: true
};

describe('REST api for getting the userType', function () {


    it('Should return the type Artist', function (done) {
        server.inject({
            method: 'POST',
            url: '/artists',
            payload: JSON.stringify(artist_data),
            headers: { 'Content-Type': 'application/json' }
        }, function (res) {
            var payload = JSON.parse(res.payload);
            console.log(payload.email);
            var artistEmail = payload.email;
            var artistId = payload.id;
            server.inject({
                method : 'GET',
                url : '/user/type/' + artistEmail,
                headers: { 'Content-Type': 'application/json' }
            }, function (res) {
                var userType = JSON.parse(res.payload);
                expect(userType.type).to.equal('Artist');
                Artist.remove({_id : artistId}).exec(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                })
            })
        })
    });

    it('Should return the type fan', function (done) {
        var fanData = fanMock.getTiniestMock();
        server.inject({
            method: 'POST',
            url: '/fans',
            payload: JSON.stringify(fanData),
            headers: { 'Content-Type': 'application/json' }
        }, function (res) {
            var payload = JSON.parse(res.payload);
            var fanEmail = payload.email;
            var fanId = payload.id;
            server.inject({
                method : 'GET',
                url : '/user/type/' + fanEmail,
                headers: { 'Content-Type': 'application/json' }
            }, function (res) {
                var userType = JSON.parse(res.payload);
                expect(userType.type).to.equal('fan');
                Fan.remove({_id : fanId}).exec(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                })
            })
        })
    });

    it('Should return the type invalid', function (done) {
        server.inject({
            method : 'GET',
            url : '/user/type/' + username + '@fake.com',
            headers: { 'Content-Type': 'application/json' }
        }, function (res) {
            var userType = JSON.parse(res.payload);
            expect(userType.type).to.equal('invalid');
            done();
        });
    });
});
