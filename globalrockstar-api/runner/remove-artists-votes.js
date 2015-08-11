'use strict';

/**
 * remove a number of votes from a given artist
 *
 */

var minimist = require('minimist');

var o = minimist(process.argv.slice(2));

if (!o.artist || (!o.facebook && !o.twitter)) {
    console.log('USAGE: node remove-artists-votes.js --artist=ARTIST_ID [--facebook=NUMBER_OF_FACEBOOK_VOTES] [--twitter=NUMBER_OF_TWITTER_VOTES]');
}

o.facebook = o.facebook || 0;
o.twitter = o.twitter || 0;

require('../lib/database');
var Artist = require('../models/artist');
var Vote = require('../models/vote');
var ArchivedVote = require('../models/archived-votes');
var ChartEntry = require('../models/chart_entry');
var Q = require('q');
Q.longStackSupport = true;
var currentContest = require('../lib/get-current-contest');
var contest;
var phase;

function removeVotes(artist, number, type) {
    if (!number) {
        return Q.resolve([]);
    }

    var voteIds;
    return Q.ninvoke(Vote.find({
        artist: artist,
        type: type,
        platform: 'desktop',
        contest: contest._id,
        phase: phase
    }).sort({
        createdAt: 1
    }).limit(number), 'exec')
        .then(function (votes) {
            voteIds = votes.map(function (v) {
                return v._id;
            });
            return Q.ninvoke(ArchivedVote.collection, 'insert', votes.map(function (v) {
                return v.toJSON();
            }));
        }).then(function () {
            return Q.ninvoke(Vote, 'remove', {
                _id: {
                    $in: voteIds
                }
            });
        }).then(function () {
            return Q.resolve(voteIds);
        });
}


function updateChartEntry(o, ids) {
    var dfd = Q.defer();

    ChartEntry.update({
        artist: o.artist,
        contest: contest._id,
        phase: phase
    }, {
        $inc: {
            'voteTypes.twitter': -o.twitter,
            'voteTypes.facebook': -o.facebook,
            'voteTypes.desktop': -(o.twitter + o.facebook),
            'votes': -(o.twitter + o.facebook)
        },
        $pullAll: {
            voteRefs: ids
        }
    }, function (err, res) {
        if (err) return dfd.reject(err);
        dfd.resolve();
    });
    return dfd.promise;
}

Artist.findById(o.artist, function (err, artist) {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    if (!artist) {
        console.error('artist not found');
        process.exit(1);
    }

    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Remove " + o.facebook + " fb votes and " + o.twitter + " twitter votes from " + artist.name + " (" + o.artist + ")? (y/n)", function (answer) {
        rl.close();
        if (['yes', 'y'].indexOf(answer.toLowerCase()) == -1) {
            console.log('Nothing to do');
            process.exit(0);
        }

        currentContest()
            .then(function (_contest) {
                contest = _contest;
                phase = contest.currentPhase.pop();
                return Q.all([
                    removeVotes(o.artist, o.twitter, 'twitter'),
                    removeVotes(o.artist, o.facebook, 'facebook'),
                ]);
            }).spread(function (fbIds, twIds) {
                return updateChartEntry(o, fbIds.concat(twIds));
            }).then(function () {
                console.log('done');
                process.exit(0);
            }).fail(function (err) {
                console.error(err);
                console.error(err.stack);
                process.exit(1);
            });
    });
});
