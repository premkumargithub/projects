'use strict';

/**
 * @module Controller.artist-statistics
 *
 * @description Provides the artist statistics  details
 *
 * @requires module:../models/artist
 * @requires module:../models/artist-statistics
 * @requires module:../models/chart_entry
 * @requires module:q
 * @requires module:lodash
 *
 */

var Artist = require('../models/artist');
// Now There is no use of this collection
// as dicuss with manuel
//var ArtistStatistics = require('../models/artist-statistics');
var ChartEntry = require('../models/chart_entry');
var Q = require("q");
var lodash = require('lodash');
var Contest = require('../models/contest');
var Hapi = require('hapi');
/**
*   @function
*   @name Controller.artist-statistics.merge
*   @descMerge and format properly statistics information
*
*   @param {object} stats statistics about votes and earnings
*   @param {object} ranks statistics about rankings
*   @returns {Array} combined statistics
*/

module.exports = {

    /**
    *   @function
    *   @name Controller.artist-statistics.statistics
    *   @desc This function is used to get the detail of the related to contest
    *   and also the detail of the project that the artist created for raising the
    *   money .
    **/
    statistics : function (req, reply) {
        var query = {$or: [{slug: req.params.id}]};

        // Check if the id is a mongodb hash and add it to the query
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }
        // This query find all the contest that are currently active
        // by comparing the final date of contest with current date
        // It return the array of the contest
        Q.ninvoke(Contest.find({
            // Condition for getting the record whose end date is greater than current date
            'cfe.time.start': {$lte: (new Date()).toISOString()},
            'finals.time.end': {$gte: (new Date()).toISOString()}
        }, {
            _id : 1,
            name : 1,
            'finals.time' : 1
        }), 'exec').then(function (_contest) {
            var contest = _contest;

            var artist;
            // get the detail of the artist
            // return the info related to artist earning
            Q.ninvoke(Artist.findOne(query, {
                _id: 1,
                earnings: 1
            }).populate('earnings.projects._id', 'title'), 'exec').then(function (_artist) {
                if (!_artist) {
                    return reply(Hapi.error.notFound());
                }
                artist = _artist;
                // confition to check if  there is any current contest going on or not
                if (contest.length) {
                    var artiststats = [];
                    // As we have a array of the contest according to new feature we can have
                    // two or more array at the same time
                    // so lodash is used to iterate through all the contest and get the id
                    // related to that contest
                    var contestsId = lodash.pluck(contest, '_id');
                    // Find the record related to contest in the chartentried collection
                    // Chartentries collection contain total votes , national rank , global rank
                    // contest name etc
                    Q.ninvoke(ChartEntry.find({
                        $and: [
                            {artist: artist._id},
                            {contest : { $in: contestsId}}
                        ]
                    }).populate('contest', 'name finals.time').sort({
                        createdAt: -1
                    }), 'exec')
                    .then(function (ranks) {
                        reply({
                            artiststat: ranks || [],
                            projects: artist.earnings.projects || [],
                            purchases : "10", // This is implemented in the future sprint
                            supervote : "10" // This is implemented in the future sprint
                        });
                    }).fail(function (err) {
                        reply(err);
                    });
                }else {
                    reply({
                        artiststat: [],
                        projects: artist.earnings.projects || [],
                        purchases : "10", // This is implemented in the future sprint
                        supervote : "10" // This is implemented in the future sprint
                    });
                }
            }).fail(function (err) {
                console.error(err);
                reply(err);
            });
        }).fail(function (err) {
            console.error(err);
            reply(err);
        });
    },

    /**
    *   @function
    *   @name Controller.artist-statistics.oldStatistics
    *   @desc Give the Old statistics detial of artist  i.e.detail related to his/her
    *   participation in old contest
    **/
    oldStatistics : function (req, reply) {

        // Find the artist detail using the artist slug
        Q.ninvoke(Artist.findOne({
            slug: req.params.slug
        }, {
            _id: 1
        }), 'exec').then(function (_artist) {
            var artist = _artist;

            // Find all the contest that are currently active
            Q.ninvoke(Contest.find({
                // Condition for getting the record whose end date is greater than current date
                'cfe.time.start': {$lte: (new Date()).toISOString()},
                'finals.time.end': {$gte: (new Date()).toISOString()}
            }, {
                _id : 1,
                name : 1,
                'finals.time' : 1
            }), 'exec').then(function (_contest) {
                var contest = _contest;
                var query = [];
                query.push({artist : artist._id});
                if (contest.length) {
                    // Storing the id of all the contest using lodash
                    var contestsId = lodash.pluck(contest, '_id');
                    query.push({contest : { $nin: contestsId}});
                }else {
                    var contestsId = 0;
                }


                // Get the old statistics of artist by excluding the id of current contest
                Q.ninvoke(ChartEntry.find({
                    $and: query
                }).populate(
                // Getting the detail of contest using populate
                    {
                        path: 'contest',
                        select: 'name',
                        model: 'Contest'
                    }
                ), 'exec').then(function (detail) {
                    reply(detail);
                }).fail(function (err) {
                    console.error(err);
                    reply(err);
                });
            }).fail(function (err) {
                console.error(err);
                reply(err);
            });
        }).fail(function (err) {
            console.error(err);
            reply(err);
        });
    }
};
