'use strict';
/**
 * @module Controller:charts
 *
 * @description Provides information about contest's charts
 *
 * @requires module:mongoose
 * @requires module:hapi
 * @requires module:../models/contest
 * @requires module:lodash
 * @requires module:q
 *
 */
var mongoose = require('mongoose');
var Hapi = require('hapi');
var Contest = require('../models/contest');
var Charts = mongoose.model('ChartEntry');
var _ = require('lodash');
var Q = require('q');

var replyCharts = function (contestId, req, reply) {
    var sortBy = req.query.sort || '-votes';
    var query = req.query.search || {};

    if (contestId) {
        query.$and = query.$and || [];
        query.$and.push({
            contest: contestId
        });
    }

    var page = req.pre.paginator.page;
    var pageSize = req.pre.paginator.pagesize;

    var finder = Charts.find(query, {voteRefs: 0})
        .sort(sortBy)
        .skip(pageSize * page)
        .limit(pageSize);

    if (req.query.populate) {
        finder = finder
            .populate('artist', '_id name slug picture totalPlays')
            .populate('song', 'youtubeUrl legacy youtube.duration youtube.id title plays state');
    } else {
        finder = finder
            .populate('artist', '_id name slug picture totalPlays fanCount country')
            .populate('contest', '_id name slug')
            .populate('song', 'youtubeUrl legacy youtube.duration youtube.id title plays state country');
    }

    Q.all([
        Charts.count(query).exec(),
        finder.lean(true).exec()
    ]).spread(function (chartsCount, charts) {
        reply({
            pages: Math.ceil((chartsCount / pageSize) * 10) / 10,
            charts: charts
        });
    });
};

//var Song = require('../models/song');
//var replyFakeCharts = function(contestId, req, reply) {
//
//
//    if( !contestId || contestId.toString() === '53a43e4bdf9df79258d92a38' ) return replyCh2arts( contestId, req, reply) ;
//
//
//    var query = { contest: contestId } ;
//    if( req.query.search && req.query.search.country ) {
//        query.country = req.query.search.country  ;
//    }
//
//    query.state = 'active' ;
//
//    var finder = Song.find( query ).select('slug _id state title artist youtube country').populate( 'artist', 'state fans fans_a slug name _id') ;
//
//    Q.ninvoke( finder, 'exec' )
//    .then( function(songs) {
//
//        Song.populate( songs, [
//            { path: 'artist.fans', /*match: { state: { $in: ['active', 'pending'] } },*/ select: '_id state', model: 'Fan' },
//            { path: 'artist.fans_a', /*match: { state: { $in: ['active', 'pending'] } }, */select: '_id state', model: 'Artist' }
//        ], function(err, songs) {
//
//            var pagesize    = req.query.pagesize || 1000 ;
//            var page        = req.query.page || 0 ;
//            var top = ( page * pagesize ) + pagesize ;
//            top = Math.min( top, songs.length ) ;
//
//            var songs = _.chain(songs)
//            .filter( function(el) { return el.artist.state.toString() == "'active'"  } )
//            .sortBy( function(el) {
//                var votes = el.artist.fans.length + el.artist.fans_a.length ;
//                return votes ;
//            })
//            .reverse()
//            .map( function(el, idx) {
//                var votes = el.artist.fans.length + el.artist.fans_a.length ;
//
//                return {
//                    pos: idx+ (page*pagesize) + 1,
//                    song: el,
//                    artist: el.artist,
//                    nPos: idx+ (page*pagesize) + 1,
//                    votes: votes,
//                    country: el.country
//                }
//            }).value() ;
//
//            var charts = songs.slice( page * pagesize, top ) ;
//
//            reply( { charts: charts, pages: Math.ceil( songs.length / pagesize ) } ) ;
//
//        }) ;
//
//    }).fail( function(err) {
//        console.log(err);
//        reply(err) ;
//    })
//
//}

module.exports = {

    /**
     * Get complete charts information of a specific contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    index: function (req, reply) {
        replyCharts(req.params.contest_id, req, reply);
    },


    /**
     * Get charts information depending on wildcards passed on req.query
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    wildcards: function (req, reply) {

        Charts.find({
            phase: req.query.toPhase,
            contest: req.params.contest_id,
            song: {$exists: true}
        }).select('song _id').exec(function (err, alreadyTransferred) {

            Charts.find({
                phase: req.query.search.phase,
                contest: req.params.contest_id,
                song: {
                    $nin: _.pluck(alreadyTransferred, 'song')
                }
            }).populate('song artist').sort('-votes').exec(function (err, wildcards) {
                console.log(err);
                console.log(wildcards.length);
                reply({page: 0, charts: wildcards});
            });

        });
    },

    /**
     * Get detailed information about a specific chart position, including details about recieved votes
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    show: function (req, reply) {
        Charts.findOne({_id: req.params.id}).populate('artist song voteRefs').exec(function (err, chart) {
            if (!chart) {
                return reply(Hapi.error.notFound());
            }
            reply(chart);
        });
    },

    /**
     * Update information about a specific chart position
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    update: function (req, reply) {
        delete req.payload.artist_name;
        delete req.payload.song_title;

        Charts.update({_id: req.params.id}, req.payload).exec(function (err, chart) {
            if (err) {
                return reply(err);
            }
            reply(chart);
        });
    },

    /**
     * Get charts about current contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    current: function (req, reply) {
        Contest.current(function (err, current) {
            replyCharts(current._id, req, reply);
        });
    },

    /**
     * Get charts about previous contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    previous: function (req, reply) {
        Contest.previous(function (err, contest) {
            replyCharts(contest._id, req, reply);
        });
    }

};
