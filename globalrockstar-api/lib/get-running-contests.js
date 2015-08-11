'use strict';

// FIXME: This module is never used.

/**
 * @module Lib:get-running-contests
 *
 * @description Get and cache information about the running contest
 *
 * @requires module:../models/contest
 * @requires module:q
 */

var Contest = require('../models/contest');
var Q = require('q');
var currentContest;
var timestamp;

/**
 * Get and cache information about the running contest
 *
 * @param {number} retries. Sets the current retry count
 * @returns {promise} the running contest if it can be retrieved within 20 sec
 */

function getRunningContests(retries) {
    if (retries > 2) {
        return Q.reject('artist-statistics: too many retries for running contest retrieval');
    }
    if (currentContest && timestamp > Date.now() - 60e3) {
        return Q.resolve(currentContest);
    }

    var dfd = Q.defer();

    Contest.running(function (err, contests) {
        if (err) {
            console.error(err);
            return setTimeout(function () {
                retries = retries || 0;
                getRunningContests(retries + 1)
                    .then(function (contests) {
                        dfd.resolve(contests);
                    }).fail(function (err) {
                        dfd.reject(err);
                    });
            }, 10e3);
        }

        currentContest = contests;
        timestamp = Date.now();

        dfd.resolve(contests);
    });

    return dfd.promise;
}

module.exports = getRunningContests;
