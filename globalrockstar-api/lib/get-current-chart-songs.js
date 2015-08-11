'use strict';

/**
 * @module Lib:get-current-chart-song
 *
 * @description Retrieve current chart songs and caches them for 1 min
 *
 * @requires module:./get-current-chartentries
 * @requires module:../models/song
 * @requires module:q
 * @requires module:lodash
 */


var currentChartEntries = require('./get-current-chartentries');
var Song = require('../models/song');
var Q = require('q');
var _ = require('lodash');
var currentChartSongs = {};
var timestamp = {};

/**
 * Retrieve current chart songs and caches them for 1 min
 * @param {number} retries private. Sets the current retry count
 * @param {string} fields to select
 * @param {string} query used to find chart entries
 * @returns {promise} currentChartEntires if the current chart-entries can be retrieved within 20 sec
 */

function getCurrentChartSongs(retries, fields, query) {
    if (retries > 2) {
        return Q.reject('artist-statistics: too many retries for current chart-songs retrieval');
    }
    var hash = 'empty';
    if (query) {
        hash = JSON.stringify(query);
    }
    if (currentChartSongs[hash] && timestamp[hash] > Date.now() - 1e3) {
        return Q.resolve(currentChartSongs[hash]);
    }

    // console.log("[perf] getCurrentChartSongs")

    var dfd = Q.defer();

    currentChartEntries(0, false, true, query)
        .then(function (chartEntries) {
            var ids = _.pluck(chartEntries, 'song').filter(function (el) {
                return el;
            });
            console.log(ids.length);
            var finder = Song.find({_id: {$in: ids}});
            if (fields) {
                finder.select(fields);
            }
            finder.populate('artist', 'genres country _id slug');
            finder = finder.sort('-stars');
            finder.exec(function (err, songs) {
                if (err) {
                    console.log(err.stack);
                    return setTimeout(function () {
                        retries = retries || 0;
                        getCurrentChartSongs(retries + 1)
                            .then(function (songs) {
                                dfd.resolve(songs);
                            }).fail(function (err) {
                                dfd.reject(err);
                            });
                    }, 10e3);
                }

                currentChartSongs[hash] = songs;
                timestamp[hash] = Date.now();

                dfd.resolve(songs);
            });
        }).fail(function (err) {
            console.log(err.stack);
        });
    return dfd.promise;
}

module.exports = getCurrentChartSongs;