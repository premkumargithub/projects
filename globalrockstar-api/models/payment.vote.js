'use strict';

var Q = require('q');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamps');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('lodash');
var Vote = require('./vote');

var nrp = require('node-redis-pubsub');
var config = require('../config');
var unagi = new nrp(config.redis);

var twoCommas = function (float) {
    return parseFloat(float).toFixed(2);
};

function createDummyVote(vote, otherSong, otherArtist) {
    if (!otherSong || !otherArtist) {
        return;
    }
    var dummy = new Vote({
        type: 'dummy',
        status: 'dummy',
        platform: vote.platform,
        voter_fan: vote.voter_fan,
        voter_artist: vote.voter_artist,
        day: vote.day,
        contest: vote.contest,
        phase: vote.phase,
        artist: otherArtist,
        song: otherSong
    });
    dummy.save(function (err) {
        console.log('vote:dummy:saved:%s', dummy._id);
        if (err) {
            console.error(err.stack);
        }
    });
}

module.exports = function (schema) {

    function createListener(sourceType, sourceId, targetType, targetId, amount) {
        if (targetType !== 'Vote') {
            return new Q();
        }

        var dfd = Q.defer();

        Q.ninvoke(mongoose.model('Vote').findOne({
            _id: targetId
        }), 'exec')
            .then(function (proj) {
                if (!proj) {
                    return dfd.reject(new Error('No mathcing vote found by id: ' + targetId));
                }
                dfd.resolve();
            });

        return dfd.promise;
    }

    function commitListener(payment) {
        if (payment.target.type !== 'Vote') {
            return new Q();
        }
        var dfd = Q.defer();

        var vote;

        Q.ninvoke(mongoose.model('Vote').findOne({
            _id: payment.target.vote
        }), 'exec')
            .then(function (_vote) {
                vote = _vote;
                vote.status = 'processed';
                createDummyVote(vote, payment.userdata.otherSong, payment.userdata.otherArtist);
                return Q.ninvoke(vote, 'save');
            })
            .then(function () {
                unagi.fire('vote:completed', {
                    vote: vote
                });
                dfd.resolve();
            })
            .fail(function (err) {
                console.error('Error occured in VoteCommitListener =>');
                console.dir(err);
                dfd.reject(err);
            });

        return dfd.promise;
    }

    schema.statics.createListeners.push({
        name: 'VoteCreateListener',
        handler: createListener
    });

    schema.statics.commitListeners.push({
        name: 'VoteCommitListener',
        handler: commitListener
    });

    schema.statics.createFromMobileVote = function (voteId) {
        var dfd = Q.defer();
        var Payment = this;

        Q.ninvoke(Vote.findById(voteId).populate('artist'), 'exec')
            .then(function (vote) {
                var shares = config.payment.paidVotePrice[vote.artist.paypal_currency];
                var amount = twoCommas(shares.gr + shares.artist);

                var payment = new Payment({
                    source: {
                        type: vote.voter_fan ? 'Fan' : 'Artist',
                        fan: vote.voter_fan,
                        artist: vote.voter_artist
                    },
                    target: {
                        type: 'Vote',
                        vote: voteId,
                        artist: vote.artist._id
                    },
                    amount: amount,
                    shares: shares,
                    currency: 'USD',
                    paymentType: 'mobile',
                    platform: vote.platform,
                    state: 'completed',
                    completed: new Date()
                });

                return Q.ninvoke(payment, 'save');
            })
            .spread(function (pmt) {
                //console.log("Creted Mobile Payment => ");
                //console.log(JSON.stringify(pmt, null, 2));
                dfd.resolve(pmt);
            })
            .fail(function (err) {
                console.error(err);
                console.error(err.stack);
                dfd.reject(err);
            });

        return dfd.promise;
    };
    // Setup indices
    schema.index({
        'source.type': 1,
        'source.fan': 1,
        'target.artist': 1,
        'target.type': 1,
        'target.vote': 1,
        'amount': 1,
        'completed': 1,
        'currency': 1
    });

};
