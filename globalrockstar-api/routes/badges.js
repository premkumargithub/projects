'use strict';

/**
 * @module Routes:badges
 *
 * @description Provides routes to create, read, update and delete
 * information about users' and fans' badges
 *
 * @requires module:hapi
 * @requires module:../models/badge
 */

var Hapi = require('hapi');//TODO: Remove
var Badge = require('../models/badge');

module.exports = function (server) {

    ['artist', 'fan'].forEach(function (type) {
        server.route([{
            method: 'GET',
            path: '/' + type + 's/{id}/badges',
            config: {

                /**
                 * Get all the badges associated to an artist or a fan
                 *
                 * @param {object} req - Request object
                 * @param {function} reply - hapi reply interface
                 */
                handler: function (req, reply) {
                    Badge.find({
                        userId: req.params.id,
                        userType: type
                    }, function (err, badges) {
                        if (err) {
                            return reply(err);
                        }
                        reply(badges);
                    });
                }
            }
        }]);
    });
};
