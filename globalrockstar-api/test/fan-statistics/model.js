'use strict';


var config = require('../../lib/database'),
    models = require('../../models');

var should = require('should'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    Stats = mongoose.model('FanStatistics'),
    Q = require('q'),
    chai = require('chai'),
    expect = chai.expect;

var ObjectId = mongoose.Types.ObjectId;

var content;
var mobile = false;

describe('FanStatistics Model', function () {
    beforeEach(function (done) {
        Stats.remove({}, done);
    });
    afterEach(function (done) {
        Stats.remove({}, done);
    });

    it('should increment twitter votes', function (done) {
        Stats.add({
            fanId: ObjectId(),
            contestId: ObjectId(),
            contestPhase: 'NP',
            platform: mobile,
            prop: 'votes.twitter'
        }).then(function () {
            return Q.ninvoke(Stats, 'findOne');
        }).then(function (stats) {
            expect(stats.votes.twitter).to.equal(1);
            expect(stats.votes.total).to.equal(1);
            done();
        }).fail(done);
    });

    it('should increment extras votes', function (done) {
        var fanId = ObjectId();
        var contestId = ObjectId();
        Stats.add({
            fanId: fanId,
            contestId: contestId,
            contestPhase: 'NP',
            platform: mobile,
            prop: 'votes.twitter'
        }).then(function () {
            return Stats.add({
                fanId: fanId,
                contestId: contestId,
                contestPhase: 'NP',
                platform: mobile,
                prop: 'votes.extra.wildcard',
                amount: 2
            });
        }).then(function () {
            return Q.ninvoke(Stats, 'findOne');
        }).then(function (stats) {
            expect(stats.votes.twitter).to.equal(1);
            expect(stats.votes.total).to.equal(3);
            expect(stats.votes.extra.total).to.equal(2);
            expect(stats.votes.extra.wildcard).to.equal(2);
            done();
        }).fail(done);
    });
});
