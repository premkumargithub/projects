'use strict';

/**
 * @module Lib:get-current-chartentries
 *
 * @description Retrieve and cache the current chart entries for 1 min
 *
 * @requires module:../models/chart_entry
 * @requires module:./get-current-contest
 * @requires module:q
 * @requires module:util
 */

var ChartEntry = require('../models/chart_entry');
var currentContest = require('./get-current-contest');
var Q = require('q');
var extend = require('util')._extend;
var currentChartEntries = {};
var timestamp = {};

/**
 * Retrieve and cache the current chart entries for 1 min
 * @param {number} retries. Sets the current retry count
 * @param {string} fields to select
 * @param {boolean} currentPhase
 * @param {search} search query
 * @param {boolean} iDontCareAboutTheCache
 * @returns {promise} currentChartEntires if the current chart-entries can be retrieved within 20 sec
 */

function getCurrentChartEntries(retries, fields, currentPhase, search, iDontCareAboutTheCache) {
    if (retries > 2) {
        return Q.reject('artist-statistics: too many retries for current chart-entries retrieval');
    }
    var hash = 'empty';

    if (search) {
        hash = JSON.stringify(search);
    }
    hash = hash + (currentPhase ? 'phase' : 'no-phase');
    if (!iDontCareAboutTheCache && currentChartEntries[hash] && timestamp[hash] > Date.now() - 1e3) {
        return Q.resolve(currentChartEntries[hash]);
    }

    var dfd = Q.defer();

    currentPhase = currentPhase || false;
    // console.log("[perf] getCurrentChartEntries")

    currentContest()
        .then(function (contest) {
            var query = {contest: contest._id};

            if (typeof currentPhase == 'string') {
                query.phase = currentPhase;
            } else if (currentPhase) {
                query.phase = contest.currentPhase.slice(-1)[0];
                query.phase = query.phase == 'pause' ? contest.previousPhase.slice(-1)[0] : query.phase;
            }

            if (search) {
                query = extend(query, search);
            }
            if (query.country === 'all') {
                delete query.country;
            }
            if (query.phase != 'np') {
                delete query.country;
            }
            var finder = ChartEntry.find(query);
            if (fields) {
                finder.select(fields);
            }

            finder.sort('-votes').exec(function (err, chartEntries) {

                if (err) {
                    console.log(err);
                    return setTimeout(function () {
                        retries = retries || 0;
                        getCurrentChartEntries(retries + 1)
                            .then(function (chartEntries) {
                                dfd.resolve(chartEntries);
                            }).fail(function (err) {
                                dfd.reject(err);
                            });
                    }, 10e3);
                }

                currentChartEntries[hash] = chartEntries;
                timestamp[hash] = Date.now();

                dfd.resolve(chartEntries);
            });
        });
    return dfd.promise;
}

module.exports = getCurrentChartEntries;
