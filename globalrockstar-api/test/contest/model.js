'use strict';

var Q = require('q'),
    config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    mongoose = require('mongoose'),
    Contest = mongoose.model('Contest'),
    slug = require('slug'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect;

var fromNow = function (n) {
    var today = new Date();
    return today.setDate(today.getDate() + n);
}

var today = new Date();

var obj_data = {
    name: "GlobalRockStar 2015",
    cfe: {
        time: {
            start: today.setDate(today.getDate() - 1),
            end: fromNow(1)
        }
    },
    np: {
        time: {
            start: fromNow(1),
            end: fromNow(2)
        }
    },
    globalfinalsQualification: {
        time: {
            start: fromNow(2),
            end: fromNow(3)
        }
    },
    globalfinalsBest64: {
        time: {
            start: fromNow(3),
            end: fromNow(4)
        }
    },
    globalfinalsBest16: {
        time: {
            start: fromNow(4),
            end: fromNow(5)
        }
    },
    finals : {
        time : {
            end : fromNow(6)
        }
    }
}

var contest, contest_id;

describe('Contest Model', function () {


    before(function (done) {
        contest = new Contest(obj_data);
        contest.save(function () {
            done();
        });
    });

    after(function (done) {
        Contest.remove({_id: contest._id}, function () {
            done();
        });
    });

    it('should Get the current Contest', function (done) {
        Contest.current(function (err, contestdata) {
            expect(contestdata.name).to.equal(obj_data.name.toLowerCase());
            done();
        });
    });

    it('should Get the current Contest phase', function (done) {
        Contest.current(function (err, contest) {
            var phase = contest.currentPhase.slice(-1);
            expect(phase[0]).to.equal('cfe');
            done();
        });
    });
});
