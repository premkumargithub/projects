'use strict';


var config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Contest = mongoose.model('Contest') ;


var should = require('should'),
    mongoose = require('mongoose'),
    Vote = mongoose.model('Vote'),
    chai = require('chai'),
    expect = chai.expect;

var ObjectId = mongoose.Types.ObjectId;
var contest_data = {
    "updatedAt" : new Date("2015-06-16T13:01:50.943Z"),
    "createdAt" : new Date("2015-06-06T13:04:32.141Z"),
    "name" : "Global Rockstar 2014",
    "webisodeNumber" : "123",
    "webisodeTitle" : "123",
    "youtubeUrl" : "123",
    "finals" : {
        "webisodeNumber" : "123",
        "content" : "123"
    },
    "globalfinalsBest16" : {
        "time" : {
            "start" : new Date("2014-01-26T23:00:00.000Z"),
            "end" : new Date("2016-01-31T23:00:00.000Z")
        },
        "webisodeNumber" : "123",
        "webisodeTitle" : "123",
        "content" : "123",
        "youtubeUrl" : "123"
    },
    "globalfinalsBest64" : {
        "time" : {
            "start" : new Date("2014-06-16T22:00:00.000Z"),
            "end" : new Date("2015-06-26T22:00:00.000Z")
        },
        "webisodeNumber" : "123",
        "webisodeTitle" : "123",
        "content" : "123",
        "youtubeUrl" : "123"
    },
    "globalfinalsQualification" : {
        "time" : {
            "start" : new Date("2014-06-30T22:00:00.000Z"),
            "end" : new Date("2016-07-03T22:00:00.000Z")
        },
        "webisodeNumber" : "123",
        "webisodeTitle" : "123",
        "content" : "123",
        "youtubeUrl" : "123"
    },
    "np" : {
        "time" : {
            "start" : new Date("2014-07-07T22:00:00.000Z"),
            "end" : new Date("2015-07-17T22:00:00.000Z")
        }
    },
    "cfe" : {
        "time" : {
            "start" : new Date("2014-06-15T22:00:00.000Z"),
            "end" : new Date("2015-06-13T22:00:00.000Z")
        }
    },
    "contestTicker" : false
} ;
var vote,contest_id,contest;


describe('Vote Model', function() {
    before(function(done) {
        Vote.find({}).remove(function(err, d) {
            vote = new Vote({
                platform: 'ios',
                type: 'facebook',
                artist: ObjectId(),
                song: ObjectId(),
                voter_artist: ObjectId()
            });

            done();
        });
        contest = new Contest(contest_data) ;
        contest.save(function (err, contest) {})
        contest_id = contest.id;
    });

    afterEach(function(done) {
        done();
    });

    after(function(done){
        Contest.find({}).remove();
        done();
    })

    it('should begin with noooo votes', function(done) {
        Vote.find({}, function(err, votes) {
            votes.should.have.length(0);
            done();
        });
    });

    it('should save a votes', function(done) {
        vote.save(function(err, p) {
            console.log(JSON.stringify(p));
            console.log(err);
            Vote.find({}, function(err, c) {
                expect(c.length).to.equal(1);
                done();
            })
        });
    });

    it('should fail when saving without valid platform', function(done) {
        vote.platform = 'buh';
        vote.save(function(err) {
            expect(err).to.exist;
            done();
        });
    });

    it('should generate the day-property on save', function(done) {
        vote.platform = 'android' ;
        vote.save(function(err, savedVote) {
            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);
            today.setMilliseconds(0);
            expect(savedVote.day.toString()).to.equal(today.toString());
            done() ;
        });
    }) ;


});
