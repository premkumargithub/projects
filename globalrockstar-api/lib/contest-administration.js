'use strict';

/**
 * @module Lib:contest-administration
 *
 * @description Utilities for the contests administration
 *
 * @requires module:../models/chart_entry
 * @requires module:../models/song
 * @requires module:../models/vote
 * @requires module:../config
 * @requires module:node-redis-pubsub
 * @requires module:q
 * @requires module:lodash
 * @requires module:mongoose
 *
 */

var ChartEntry = require('../models/chart_entry'),
    Song = require('../models/song'),
    Vote = require('../models/vote'),
    config = require('../config'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp(config.redis),
    Q = require('q'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    createChartEntry = Q.nbind(ChartEntry.collection.insert, ChartEntry.collection);

// var createChartEntry = Q.nbind( ChartEntry.create, ChartEntry );
var removeChartEntries = Q.nbind(ChartEntry.remove, ChartEntry);
var emptyVoteTypes = {
    facebook: 0,
    twitter: 0,
    desktop: 0,
    ios: 0,
    android: 0,
    purchase: 0,
    dummy: 0,
    bonus: 0,
    serie: 0,
    wildcard: 0,
    fan: 0
};

module.exports = {};

/**
 * Bootstrap charts data
 *
 * @param contest {model} mongoose model of a contest
 * @param cb {function} callback function
 */
module.exports.bootstrap = function (contest, cb) {
    var songs;

    // Remove chart entries having phase === 'np'
    removeChartEntries({contest: contest._id, phase: 'np'})
        .then(function () {
            // Populate song model with relative artist information
            return Song.find({state: 'active', contest: contest._id}).populate('artist').exec();
        })
        .then(function (_songs) {
            songs = _songs;
            // Filter all the active songs
            songs = songs.filter(function (el) {
                console.log(el.artist.state.toString());
                return el.artist.state.toString().replace(/['"]+/g, '') === 'active';
            });

            console.log(songs.length);

            // Create a chart entry, mapping each song to generic informations about contest
            var chartEntry = _.map(songs, function (song) {
                return {
                    contest: contest._id,
                    artist: song.artist._id,
                    song: song._id,
                    phase: 'np',
                    votes: 0,
                    pos: 0,
                    nPos: 0,
                    voteTypes: emptyVoteTypes,
                    country: song.artist.country
                };
            });
            return createChartEntry(chartEntry);
        })
        .then(function () {
            cb(null, {'status': 'ok'});
        })
        .fail(function (err) {
            console.dir(err);
            cb(err);
        });
};

// Contest metadata
var contestMeta = {
    countForToPhase: {
        'globalfinalsQualification': 100,
        'globalfinalsBest64': 60,
        'globalfinalsBest16': 14
    },
    wildcardsForToPhase: {
        'globalfinalsQualification': 0,
        'globalfinalsBest64': 4,
        'globalfinalsBest16': 2
    },
    phases: ['cfe', 'np', 'globalfinalsQualification', 'globalfinalsBest64', 'globalfinalsBest16']
};


/*
 var resolveVotes = function(entries, contest, toPhase, retries) {
 retries = retries || 0 ;

 entries = _.chain( entries )
 .groupBy( 'votes' )
 .value() ;

 var ids = _.chain( entries )
 .pluck('length')
 .value() ;

 console.log(ids.join("|")) ;


 var resolve = _.chain(entries)
 .pluck('length')
 .all( function(el) { return el == 1 })
 .value() ;

 console.log("--> resolve retry " + retries + " finished " + ( resolve ? 'yep' : 'nope' ) ) ;

 _.every( entries, function(val, key ) {
 if( val.length == 1 ) return true;

 console.log(val);

 var sortedEntries = _.sortBy( val, function(el) {

 var socialVotes = el.voteTypes.twitter + el.voteTypes.facebook ;
 // var socialVotes = el.voteRefs.filter( function(vote) {
 //     return ['twitter', 'facebook'].indexOf( vote.type ) >= 0
 // }).length ;

 var fans = el.artist.fans.length + el.artist.fans_a.length ;
 return socialVotes + fans ;

 }).reverse() ;


 var saved = [] ;
 sortedEntries.forEach( function(el, i) {
 _.times(sortedEntries.length - (i+1), function(n) {
 saved.push( Q.ninvoke( Vote.createBonusForPhase( el.song, el.artist, toPhase ), 'save' ) ) ;
 }) ;
 }) ;

 var shiftUp = sortedEntries.length;

 ChartEntry.find({ votes: { $gt: key }, contest: contest._id, phase: toPhase }).exec( function(err, upper) {
 upper.map(function(up) {
 _.times( shiftUp, function(n) {
 saved.push( Q.ninvoke( Vote.createBonusForPhase( up.song, up.artist, toPhase ), 'save' ) )
 }) ;
 }) ;

 Q.all(saved).then( function(data) {
 return ChartEntry.find({ votes: { $gt: 0 }, contest: contest._id, phase: toPhase })
 .populate('artist', 'fans fans_a _id')
 //                    .populate('voteRefs')
 .sort("votes").exec( function(err, newEntries) {
 return resolveVotes( newEntries, contest, toPhase, retries + 1 ) ;
 }) ;
 }) ;
 }) ;
 return false ;
 }) ;

 }
 */

/**
 * Normalize votes
 *
 * @param dfd {defer} Q deferred
 * @param contest {model} Mongoose model representing the contest
 * @param toPhase {string} contest phase
 * @param retries {int} Number of retries
 * @param country {string}
 *
 * @returns Q.deferred
 */
var normalizeVotes = function (dfd, contest, toPhase, retries, country) {

    dfd = dfd || Q.defer();
    retries = retries || 0;

    var chartEntryQuery = {votes: {$gt: 0}, contest: contest._id, phase: toPhase};
    if (country) {
        chartEntryQuery.country = country;
        chartEntryQuery.nPos = 1;
    }

    // Find chart entries and sort them by votes
    var finder = ChartEntry.find(chartEntryQuery)
        .select('artist voteTypes song votes')
        .populate('artist', 'fanCount')
        //.populate('voteRefs', 'type')
        .sort('votes');

    Q.ninvoke(finder, 'exec')
        .then(function (entries) {
            entries = _.chain(entries).groupBy('votes').value();
            var ids = _.chain(entries).pluck('length').value();

            console.log(ids.join('|'));

            var resolve = _.chain(entries).pluck('length').all(function (el) {
                return el === 1;
            }).value();
            console.log('--> resolve retry ' + retries + ' finished ' + (resolve ? 'yep' : 'nope'));

            if (resolve) {
                return dfd.resolve(entries);
            }

            _.every(entries, function (val, key) {
                if (val.length === 1) {
                    return true;
                }
                var sortedEntries = _.sortBy(val, function (el) {
                    var socialVotes = el.voteTypes.facebook + el.voteTypes.twitter;
                    /*
                     var socialVotes = el.voteRefs.filter( function(vote) {
                     return ['twitter', 'facebook'].indexOf( vote.type ) >= 0
                     }).length  ; */

                    // var fans = el.artist.fans.length + el.artist.fans_a.length ;
                    return socialVotes + el.artist.fanCount;
                }).reverse();


                var saved = [];
                sortedEntries.forEach(function (el, i) {
                    _.times(sortedEntries.length - (i + 1), function () {
                        saved.push(Q.ninvoke(Vote.createBonusForPhase(el.song, el.artist, toPhase), 'save'));
                    });
                });

                var shiftUp = sortedEntries.length;

                ChartEntry.find({
                    votes: {$gt: key},
                    contest: contest._id,
                    phase: toPhase
                }).select('artist song').exec(function (err, upper) {
                    upper.map(function (up) {
                        _.times(shiftUp, function () {
                            saved.push(Q.ninvoke(Vote.createBonusForPhase(up.song, up.artist, toPhase), 'save'));
                        });
                    });

                    Q.all(saved).then(function () {

                        return normalizeVotes(dfd, contest, toPhase, retries + 1, country);
                        /*return ChartEntry.find({ votes: { $gt: 0 }, contest: contest._id, phase: toPhase })
                         .populate('artist', 'fans fans_a _id')
                         .populate('voteRefs', 'type')
                         .sort("votes").exec( function(err, newEntries) {
                         return normalizeVotes( dfd, contest, toPhase, retries + 1, country ) ;
                         }) ; */
                    });
                });
                return false;
            });
        }).fail(function (err) {
            return dfd.reject(err);
        });

    return dfd.promise;
};

/**
 *
 *
 * @param toPhase {string} contest phase
 * @param contest {model} Mongoose model
 * @param groupBycountries {boolean}
 * @param cb {function} callback function
 */
module.exports.normalize = function (toPhase, contest, groupBycountries, cb) {

    if (!(contest._id instanceof mongoose.Types.ObjectId)) {
        contest._id = mongoose.Types.ObjectId(contest._id);
    }


    if (groupBycountries) {
        ChartEntry.find({contest: contest._id, phase: 'np'}).distinct('country', function (err, countries) {
            console.log(err);
            console.log(countries);
            var countryLength = countries.length;
            var counter = 0;
            countries.forEach(function (country) {
                normalizeVotes(null, contest, toPhase, 0, country).then(function () {
                    console.log('done for country: ' + country);
                    counter += 1;
                    if (counter === countryLength) {
                        cb(null, []);
                    }
                });
            });
        });
    } else {
        normalizeVotes(null, contest, toPhase, 0, null).then(function (entries) {
            console.log('WE DID IT!!');
            cb(null, entries);
        }).fail(function (err) {
            cb(err);
        });
    }
};


/**
 *
 * Change contest info to another phase
 *
 * @param toPhase {string} contest phase
 * @param contest {model} mongoose model
 * @param cb {function} callback
 * @returns {defer} Q deferred
 */
module.exports.transferTo = function (toPhase, contest, cb) {
    var toIndex = contestMeta.phases.indexOf(toPhase);

    if (!(contest._id instanceof mongoose.Types.ObjectId)) {
        contest._id = mongoose.Types.ObjectId(contest._id);
    }

    if (toIndex < 2 || toIndex === 5) {
        console.log('index error');
        return cb({err: 'nope'});
    }

    var fromIndex = toIndex - 1;
    var fromPhase = contestMeta.phases[fromIndex];

    var count = contestMeta.countForToPhase[toPhase];
    var wildcards = contestMeta.wildcardsForToPhase[toPhase];

    console.log('FROM  ' + fromPhase);
    console.log('COUNT ' + count);

    var withVotes = fromPhase !== 'np';
    var query = null;

    if (fromPhase === 'np') {
        query = {contest: contest._id, phase: fromPhase, nPos: 1};
    } else {
        query = {contest: contest._id, phase: fromPhase};
    }
    // query.votes = { $gt: 0 } ;

    var finder = ChartEntry
        .find(query)
        .populate('artist', 'fans fans_a _id')
        .populate('voteRefs')
        .lean(true)
        .sort('-votes');

    removeChartEntries({contest: contest._id, phase: toPhase})
        .then(function () {
            console.log('deleted');
            return Q.ninvoke(finder, 'exec');
        })
        .then(function (fromChartEntries) {

            if (fromChartEntries.length === 0) {
                throw new Error('no chart entries found');
            }

            var limitChartEntries = fromChartEntries;
            if (limitChartEntries.length >= count && fromPhase !== 'np') {
                limitChartEntries = limitChartEntries.slice(0, count);
            }

            console.log(' LENGTH == ' + limitChartEntries.length);

            var toChartEntries = limitChartEntries.map(function (fromEntry) {
                return {
                    contest: contest._id,
                    artist: fromEntry.artist._id,
                    song: fromEntry.song,
                    phase: toPhase,
                    votes: withVotes ? fromEntry.votes : 0,
                    // voteRefs: withVotes ? fromEntry.voteRefs : [],
                    voteTypes: withVotes ? fromEntry.voteTypes : emptyVoteTypes,
                    pos: 0,
                    nPos: 0,
                    country: fromEntry.country
                };
            });


            console.log(toChartEntries);

            _.times(wildcards, function (n) {
                toChartEntries.push({
                    contest: contest._id,
                    phase: toPhase,
                    votes: 0,
                    pos: 0,
                    nPos: 0,
                    voteTypes: emptyVoteTypes,
                    wildcard: {
                        position: n + 1,
                        anouncement: contest[toPhase] ? contest[toPhase].time.start : new Date()
                    }
                });
            });

            return createChartEntry(toChartEntries);

        }).then(function (saved) {
            console.log(saved);

            var query = null;
            query = {contest: contest._id, phase: toPhase};
            //   query.votes = { $gt: 0 } ;
            var finder = ChartEntry.find(query).populate('artist', '_id').sort('votes');

            return Q.ninvoke(finder, 'exec');

        }).then(function (newChartEntries) {

            var artistIds = newChartEntries.filter(function (entry) {
                return entry.artist !== null;
            }).map(function (entry) {
                return entry.artist._id;
            });

            var firePayload = {
                contest: contest._id,
                from: fromPhase,
                to: toPhase,
                artists: artistIds
            };

            unagi.fire('contests:transfer:createbadges', firePayload);
            unagi.enqueue('charts:update', {phase: toPhase, contest: contest._id});

            return cb(null, {status: 'ok'});
            /*

             if( newChartEntries.length == 0 ) return cb( null, { status: 'ok'} ) ;


             console.log('-> resolving votes');
             resolveVotes( newChartEntries, contest, toPhase ) ;
             console.log('<- resolving finished');
             return cb( null, { status: 'ok'} ) ;
             */
        }).fail(function (err) {
            console.log(err);
            console.log(err.stack);
            cb(err);
        });
};
