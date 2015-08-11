'use strict';

/**
 * @module Routes:artist-statistics
 *
 * @description Provides routes to get statistics about artists
 *
 * @requires module:../models/artist
 * @requires module:../models/artist-statistics
 * @requires module:../models/chart_entry
 * @requires module:q
 * @requires module:lodash
 *
 */

var Artist = require('../models/artist');
var ArtistStatistics = require('../models/artist-statistics');
var ChartEntry = require('../models/chart_entry');
var Q = require("q");
var lodash = require('lodash');
var Contest = require('../models/contest');
var ObjectID =   require('mongoose').Types.ObjectId;
var ArtistStatisticsController = require('../controllers/artist-statistics');
/**
 * Merge and format properly statistics information
 *
 * @param {object} stats statistics about votes and earnings
 * @param {object} ranks statistics about rankings
 * @returns {Array} combined statistics
 */

module.exports = function (server) {
    server.route([

        /**
        *   @event
        *   @name Routes:artist-statistics./artists/slug/statistics
        *   @desc This event fire to get the statistics of artist if we participate 
        *   in the current contest
        **/
        {
            method: 'GET',
            path: '/artists/{id}/statistics',
            config: {
                description: 'List artist statistics',

                /**
                 * Get complete statistics about an artist
                 *
                 * @param {object} req - Request object
                 * @param {function} reply - hapi reply interface
                 */
                handler: ArtistStatisticsController.statistics
            }
        },

        /**
        *   @event
        *   @name Routes:artist-statistics./artists/slug/oldStatistics
        *   @desc This event fire to get the old statistics of the artist
        *   if he taken part in the previous contest
        **/
        {
            method: 'GET',
            path: '/artists/{slug}/oldStatistics',
            config: {
                description: 'List artist statistics',

                /**
                 * Get complete statistics about an artist
                 *
                 * @param {object} req - Request object
                 * @param {function} reply - hapi reply interface
                 */
                handler: ArtistStatisticsController.oldStatistics
            }
        }
    ]);
};
