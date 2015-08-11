'use strict';

/**
 * @module Routes:configs
 *
 * @description Provides routes to get information about configs
 *
 * @requires module:path
 * @requires module:fs
 * @requires module:../lib/twitter-conf
 * @requires module:../config
 * @requires module:q
 */

var path = require('path');
var fs = require('fs');
var twitterConfig = require('../lib/twitter-conf');
var config = require('../config');
var Q = require('q');

module.exports = function (server) {
    var dataCache = {};
    server.route([{
        method: 'GET',
        path: '/config/{id}',
        /**
         * Return static json files stored in public/configs.
         * The {id} param is the name of the json file (countries, generes, ...)
         *
         * @param {object} req - Request object
         * @param {function} reply - hapi reply interface
         */
        handler: function (req, reply) {

            if (dataCache[req.params.id]) {
                return reply(dataCache[req.params.id]).type('application/json');
            }
            var fileName = path.join(__dirname, '../public/configs', req.params.id + '.json');
            console.log('Caching file ' + fileName);
            Q.ninvoke(fs, 'readFile', fileName, 'utf8')
                .then(function (data) {
                    dataCache[req.params.id] = data;
                    reply(dataCache[req.params.id]).type('application/json');
                })
                .fail(function (err) {
                    console.error(err);
                    reply().code(500);
                });
        }
    }]);
    // Return a static json file stored in ../lib/twitter-conf
    server.route([{
        method: 'GET',
        path: '/config/twitter',
        handler: function (req, reply) {
            reply(twitterConfig);
        }
    },
        // Return paid vote price information based on {currency} param.
        {
            method: 'GET',
            path: '/config/paid-vote-price/{currency}',
            handler: function (req, reply) {
                return reply(config.payment.paidVotePrice[req.params.currency]);
            }
        }]);
};

