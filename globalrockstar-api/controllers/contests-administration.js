'use strict';

/**
 * @module Controller:contents-administration
 *
 * @description Manage contest administration
 *
 * @requires module:hapi
 * @requires ../lib/contest-administration
 * @requires lodash
 * @requires ./config
 * @requires ../models/chart_entry
 * @requires ../models/vote
 * @requires module:q
 * @requires module:../mailer/schedule-mailer-template
 * @requires module:../models/artist
 * @requires module:node-redis-pubsub
 */
var Hapi = require('hapi');
var ContestAdmin = require('../lib/contest-administration');
var _ = require('lodash');
var config = require('../config');
var ChartEntry = require('../models/chart_entry');
var Vote = require('../models/vote');
var Q = require('q');
var mailer = require('../mailer/schedule-mailer-template');
var Artist = require('../models/artist');
var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);

module.exports = {

    /**
     * Set wildcards on contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    setWildcards: function (req, reply) {
        console.log('SET WILDCARDS');
        var contest = req.pre.contest;
        var phase = req.payload.phase;

        var wildcards = _.reduce(req.payload.wildcard, function (ret, val, key) {
            if (val.pos === '') {
                return ret;
            }

            ret.push({
                phase: phase,
                song: key,
                artist: val.artist,
                chartId: val.chart_id,
                contest: contest._id,
                val: parseInt(val.pos)
            });

            return ret;
        }, []);

        console.log(wildcards);

        var toIndex = config.phases.indexOf(phase);

        if (toIndex < 2 || toIndex === 5) {
            console.log('index error');
            return reply(Hapi.error.badRequest('phase error'));
        }

        var fromIndex = toIndex - 1;
        var fromPhase = config.phases[fromIndex];

        var pos = config.contestMeta.countForToPhase[phase] + 1;

        /* var lastPositionsFinder =  ChartEntry.find( { contest: contest._id, phase: phase })
         .select('_id votes phase contest')
         .sort('-votes')
         .limit( pos - 1) ;
         */

        var lastPositionsFinder = ChartEntry.find({contest: contest._id, phase: fromPhase})
            .select('_id votes phase contest voteTypes')
            .lean(true)
            .sort('-votes')
            .limit(pos);

        var basePositionsFinder = ChartEntry.find({contest: contest._id, phase: phase})
            .select('_id votes phase contest artist song wildcard')
            .lean(true)
            .sort('-votes')
            .limit(pos - 1);

        var basePositions = [];
        var shiftOriginalUp = 0;

        Q.all([Q.ninvoke(basePositionsFinder, 'exec'), Q.ninvoke(lastPositionsFinder, 'exec')])
            .spread(function (_basePositions, lastPositions) {
                basePositions = _basePositions;
                var lastPosition = lastPositions.slice(-1)[0];
                var basePosition = basePositions.slice(-1)[0];
                var bonusVotesPromieses = wildcards.map(function (wildcard) {

                    var newVotes = 0;

                    return Q.ninvoke(ChartEntry.findOne({
                        phase: fromPhase,
                        contest: contest._id,
                        song: wildcard.song
                    }).lean(true), 'exec')
                        .then(function (oldChartEntry) {

                            if (oldChartEntry.votes <= lastPosition.votes) {
                                newVotes = lastPosition.votes - oldChartEntry.votes + 1;
                            }

                            newVotes += config.contestMeta.wildcardsForToPhase[phase] - wildcard.val;

                            var bonusVotes = oldChartEntry.votes + newVotes;
                            if (bonusVotes >= (basePosition.votes + shiftOriginalUp)) {
                                shiftOriginalUp += (bonusVotes - (basePosition.votes + shiftOriginalUp)) + 1;
                            }

                            var voteTypes = oldChartEntry.voteTypes;

                            var query = {phase: phase, contest: contest._id, 'wildcard.position': wildcard.val};
                            var payload = {
                                country: oldChartEntry.country,
                                song: wildcard.song,
                                votes: oldChartEntry.votes,
                                voteTypes: voteTypes,
                                artist: wildcard.artist
                            };

                            return Q.ninvoke(ChartEntry.findOne(query), 'exec').then(function (entry) {
                                entry.country = payload.country;
                                entry.song = payload.song;
                                entry.votes = payload.votes;
                                entry.voteTypes = payload.voteTypes;
                                entry.artist = payload.artist;
                                entry.voteTypes.wildcard = 0;

                                return Q.ninvoke(entry, 'save');
                            });

                        })
                        .then(function () {
                            var bonusVotes = [];

                            _.times(newVotes, function () {
                                bonusVotes.push(Vote.payloadWildcardForPhase(wildcard.song, wildcard.artist, phase));
                            });

                            return bonusVotes;

                        }).fail(function (err) {
                            console.log('ERRv ');
                            console.log(err);
                            console.log(err.stack);
                        });

                });

                return bonusVotesPromieses;

            }).then(function (bonusVotes) {
                return Q.all(bonusVotes);

            }).then(function (bonusVotes) {
                if (shiftOriginalUp > 0) {
                    basePositions.forEach(function (base) {
                        _.times(shiftOriginalUp, function (n) {
                            console.log(n);
                            if (!base.wildcard) {
                                bonusVotes.push(Vote.payloadBonusForPhase(base.song, base.artist, phase));
                            }
                        });
                    });
                }

                return Q.ninvoke(Vote, 'create', _.flatten(bonusVotes));
            }).then(function (createdBonusVotes) {
                var firePayload = {
                    contest: contest._id,
                    from: fromPhase,
                    to: phase,
                    artists: wildcards.map(function (el) {
                        return el.artist;
                    })
                };

                unagi.fire('contests:wildcards:createbadges', firePayload);

                unagi.fire('contests:transfer:createbadges', firePayload);

                reply({created: createdBonusVotes});

                Artist.find({_id: {$in: firePayload.artists}}).select('_id email name slug').exec(function (err, artists) {
                    artists.forEach(function (artist) {
                        mailer(artist, 'contestants-wildcard-notifier', 'http://www.globalrocksgtar.com/artists' + artist.slug);
                    });
                });

            }).fail(function (err) {
                console.log(err.stack);
                reply(err);
            });

    },

    /**
     * Normalize votes
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    normalize: function (req, reply) {
        console.log('normalizing contest ' + req.pre.contest.name);
        ContestAdmin.normalize(req.payload.to, req.pre.contest, req.payload.withCountries, function (err, res) {
            if (err) {
                reply(err);
            }
            console.log('YO');
            reply(res);
        });
    },

    /**
     * Bootstrap contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    bootstrap: function (req, reply) {
        console.log('bootstrapping contest ' + req.pre.contest.name);
        ContestAdmin.bootstrap(req.pre.contest, function (err, res) {
            if (err) {
                return reply(err);
            }
            reply(res);
        });
    },

    /**
     * Move contest to another phase
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    transfer: function (req, reply) {
        ContestAdmin.transferTo(req.payload.to, req.pre.contest, function (err, res) {
            if (err) {
                return reply(err);
            }
            reply(res);
        });
    }


};
