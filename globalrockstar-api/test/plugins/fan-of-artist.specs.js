/* global describe, it, before, after, beforeEach, afterEach */
'use strict';

var Q = require('q');
var config = require('../../lib/database');
var models = require('../../models');
var should = require('should');
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var Fan = mongoose.model('Fan');
var slug = require('slug');
var dbUtil = require('../util/db.js');
var fanUtil = require('../util/fan');
var artistUtil = require('../util/artist');

var fan;

describe('Fan Of Artist Plugin', function () {
    var artist;
    var artist2;
    var fan;
    var fan2;
    beforeEach(function (done) {
        dbUtil.resetDB()
            .then(function () {
                return Q.all([artistUtil.savedArtist(), fanUtil.savedFan(), artistUtil.savedArtist(), fanUtil.savedFan()]);
            })
            .spread(function (_artist, _fan, _artist2, _fan2) {
                artist = _artist;
                fan = _fan;
                artist2 = _artist2;
                fan2 = _fan2;
                //console.dir(artist);
                //console.dir(fan);
                done();
            })
            .fail(function (err) {
                console.error(err);
                done(err);
            });
    });

    it('should expose property "fan_of_artist" on model "Fan"', function (done) {
        should.exist(fan.fan_of_artist);
        done();
    });
    it('should expose property "fan_of_artist" on model "Artist"', function (done) {
        should.exist(artist.fan_of_artist);
        done();
    });

    it('should expose method becameFanOf("artistId") on model "Fan"', function (done) {
        should.exist(fan.becameFanOf);
        done();
    });

    it('should expose method becameFanOf("artistId") on model "Artist"', function (done) {
        should.exist(artist.becameFanOf);
        done();
    });

    describe('becameFanOf', function () {
        var r0, r1, r2, r3, r4;
        beforeEach(function (done) {

            Q.allSettled([
                fan.becameFanOf(artist._id),
                artist.becameFanOf(artist2._id),
                artist.becameFanOf(artist._id),
                artist.becameFanOf(fan._id),
                fan.becameFanOf(fan._id)
            ]).spread(function (_r0, _r1, _r2, _r3, _r4) {
                r0 = _r0.state === 'fulfilled' ? _r0.value : null;
                r1 = _r1.state === 'fulfilled' ? _r1.value : null;
                r2 = _r2.state === 'fulfilled' ? _r2.value : null;
                r3 = _r3.state === 'fulfilled' ? _r3.value : null;
                r4 = _r4.state === 'fulfilled' ? _r4.value : null;
                done();
            })
                .fail(function (err) {
                    console.log(err);
                });
        });
        it('adds the "artistId" to the "fan_of_artist" array of fan', function () {
            r0.fan_of_artist[0].toString().should.equal(artist._id.toString());
        });
        it('adds the "artistId" to the "fan_of_artist" array artist', function () {
            r1.fan_of_artist[0].toString().should.equal(artist2._id.toString());
        });

        it('does not add a fan id to fan_of_atistist', function (done) {
            var fan3;
            var artist3;
            Q.all([fanUtil.savedFan(), artistUtil.savedArtist()])
                .spread(function (_fan, _artist) {
                    fan3 = _fan;
                    artist3 = _artist;

                    return artist3.becameFanOf(fan3._id);
                })
                .then(function () {
                    done(new Error('this should fail'));
                }).fail(function () {
                    done();
                });
        });

        it('cannot be your own fan', function (done) {
            var fan3;
            var artist3;
            Q.all([fanUtil.savedFan(), artistUtil.savedArtist()])
                .spread(function (_fan, _artist) {
                    fan3 = _fan;
                    artist3 = _artist;

                    return artist3.becameFanOf(artist3._id);
                })
                .then(function () {
                    done(new Error('this should fail'));
                }).fail(function () {
                    done();
                });
        });
    });

});
