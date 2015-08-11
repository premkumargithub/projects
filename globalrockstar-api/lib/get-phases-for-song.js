'use strict';

// FIXME: This module is never used.

/**
 * @module Lib:get-phases-for-song
 *
 * @description Retrieve and cache the phases for a single song
 *
 * @requires module:./get-current-chartentries
 * @requires module:../models/song
 * @requires module:q
 * @requires module:../config
 * @requires module:lodash
 */

var currentChartEntries = require('./get-current-chartentries');
var Song = require('../models/song');
var Q = require('q');
var config = require('../config');
var _ = require('lodash');
var cachedSongs = {};
var timestamp = {};

/**
 *
 * Retrieve and cache the phases for a single song
 * @param {object[]} retries number of retries
 * @param {object[]} songs array of mongoose instances representing a song
 * @returns {promise} songs' phases if they can be retrieved within 20 sec
 */
function getPhasesFor(retries, songs) {
    songs = typeof songs === Array ? songs : [songs];
    if (retries > 2) {
        return Q.reject('artist-statistics: too many retries for current chart-songs retrieval');
    }
    var hash = _.pluck(songs, "_id").join("-");
    if (cachedSongs[hash] && timestamp[hash] > Date.now() - 30e3) {
        return Q.resolve(cachedSongs[hash]);
    }

    var dfd = Q.defer();

    currentChartEntries(0, false, false, {song: {$in: _.pluck(songs, "_id")}})
        .then(function (chartEntries) {
            var phases = _.pluck(chartEntries, 'phase');
            phases = _.sortBy(phases, function (phase) {
                var index = _.indexOf(config.phases, phase);
                return index === -1 ? config.phases.length : index;
            });

            cachedSongs[hash] = phases;
            timestamp[hash] = new Date();
            dfd.resolve(phases);
        })
        .fail(function (err) {
            dfd.reject(err);
        });

    return dfd.promise;
}

module.exports = getPhasesFor;