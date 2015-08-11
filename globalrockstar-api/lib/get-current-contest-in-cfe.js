'use strict';

/**
 * @module Lib:get-current-contest-in-cfe
 *
 * @description Retrieve and cache the current contest in cfe for 1 min
 *
 * @requires module:../models/contest
 * @requires module:q
 */

var Contest = require('../models/contest');
var Q = require('q');
var currentContest;
var timestamp;

/**
 * Retrieve and cache the current contest in cfe for 1 min
 * @param {number} retries private. Sets the current retry count
 * @returns {promise} currentContest if the current contest can be retrieved within 20 sec
 */

function getCurrentContest(retries) {
    if (retries > 2) {
        return Q.reject('artist-statistics: too many retries for current contest retrieval');
    }
    if (currentContest && timestamp > Date.now() - 1e3) {
        return Q.resolve(currentContest);
    }

    var dfd = Q.defer();
    // console.log("[perf] getCurrentContest")
    Contest.inCfe(function (err, contest) {
        if (err) {
            console.error(err);
            return setTimeout(function () {
                retries = retries || 0;
                getCurrentContest(retries + 1)
                    .then(function (contest) {
                        dfd.resolve(contest);
                    }).fail(function (err) {
                        dfd.reject(err);
                    });
            }, 10e3);
        }

        currentContest = contest;
        timestamp = Date.now();
        dfd.resolve(contest);
    });
    return dfd.promise;
}

module.exports = getCurrentContest;