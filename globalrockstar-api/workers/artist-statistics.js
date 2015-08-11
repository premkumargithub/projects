'use strict';

/* Updates the artist statistics periodically
*
*/

var agenda = require('../lib/agenda');
var Q = require('q');
var ArtistStatistics = require('../models/artist-statistics');
var Contest = require('../models/contest');
var Vote = require('../models/vote');
var Song = require('../models/song');
var config = require('../config');

var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);

var time;

function getVotesForPhase(contest, phase) {
    console.log('get votes for contest %s - %s', contest, phase);
    return Q.ninvoke(Vote, 'aggregate', [
        {
            $match: {
                status: 'processed',
                type: { $ne: 'dummy' },
                phase: phase,
                contest: contest
            }
        },
        {
            $group: {
                _id: '$artist',
                total: {$sum: 1},
                twitter: {$sum: {$cond: [{$eq: [ "$type", 'twitter']}, 1, 0]}},
                facebook: {$sum: {$cond: [{$eq: [ "$type", 'facebook']}, 1, 0]}},
                purchase: {$sum: {$cond: [{$eq: [ "$type", 'purchase']}, 1, 0]}},
                bonus: {$sum: {$cond: [{$eq: [ "$type", 'bonus']}, 1, 0]}},
                mobile: {$sum: {$cond: [{$ne: [ "$platform", 'desktop']}, 1, 0]}},
                series: {$sum: {$cond: [{$eq: [ "$series_vote", true]}, 1, 0]}},
            }}
    ]);
}

function updateStats(votes, contest, phase) {
    if (!votes.length) return;
    var vote = votes.pop();
    if (vote.total == 0) return updateStats(votes, contest, phase);
    ArtistStatistics.update({
        artistId: vote._id,
        'contest.id': contest._id,
        'contest.phase': phase
        }, {
            $set: {
                votes: {
                    total: vote.total,
                    twitter: vote.twitter,
                    facebook: vote.facebook,
                    purchase: vote.purchase,
                    extra: {
                        series: vote.series / 3,
                        wildcard: vote.bonus,
                        total: vote.series / 3 + vote.bonus
                    }

                }
            }
        }, {
            upsert: true
        }, function (err) {
            if (err) {
                console.error('artist-statistics:error');
                console.error(err);
            }

            if (votes.length) return updateStats(votes, contest, phase);

            console.log('artist-stats:done:contest:%s:phase:%s:time:', contest.name, phase, Date.now() - time);
        });
}

function loopPhases(contest) {
    config.phases.forEach(function (phase) {
        if (phase == 'cfe') return;
        if (phase == 'finals') return;
        getVotesForPhase(contest._id, phase)
        .then(function (votes) {
            updateStats(votes, contest, phase);
        }).fail(function (err) {
            console.error(err);
            console.error(err.stack);
        });
    });
}

function recalculateArtistStatistics() {
    console.log('artist-statistics:recalculate');
    time = Date.now();
    Q.ninvoke(Contest, 'find').then(function (contests) {
        contests.forEach(loopPhases);
    });
}

// agenda.define('recalculate-artist-statistics', recalculateArtistStatistics)
// 
// agenda.every('* 3 * * *', 'recalculate-artist-statistics');
// 
// console.log('Loading worker for artist statistics');
// 
// unagi.on('artist-statistics:recalculate', recalculateArtistStatistics);
