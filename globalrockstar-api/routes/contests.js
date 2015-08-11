'use strict';

/**
 * @module Routes:contests
 *
 * @description Provides routes to create, read, update and delete information about contests
 *
 * @requires module:hapi
 * @requires module:mongoose
 * @requires module:../controllers/contests
 * @requires module:../lib/pre-search-query
 */
var Hapi = require('hapi'),
    mongoose = require('mongoose'),
    Contest = mongoose.model('Contest'),
    ContestsController = require('../controllers/contests'),
    preSearchQuery = require('../lib/pre-search-query');

module.exports = function (server) {
    /**
     * Find a contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    var findContest = function (req, reply) {
        var query = {$or: [{slug: req.params.id}]};
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }
        Contest.findOne(query).exec(function (err, contest) {
            if (err) {
                return reply(err);
            }
            if (!contest) {
                return reply(Hapi.error.notFound());
            }

            reply(contest);
        });
    };

    var preConfig = [
        {
            method: findContest,
            assign: 'contest'
        }
    ];

    server.route([
        // Get a contest
        {
            method: 'GET',
            path: '/contests',
            config: {
                pre: preSearchQuery,
                cache: {
                    privacy: 'public',
                    expiresIn: 5 * 60 * 1000
                },
                handler: ContestsController.index
            }
        },
        // Get stats about a specific contest
        {
            method: 'GET',
            path: '/contests/{id}/stats',
            config: {
                pre: preConfig,
                handler: ContestsController.stats
            }
        },
        // Get a specific contest based on the {id}
        {
            method: 'GET',
            path: '/contests/{id}',
            config: {
                cache: {
                    privacy: 'public',
                    expiresIn: 5 * 60 * 1000
                },
                handler: ContestsController.show
            }
        },
        // Create a new contest
        {
            method: 'POST',
            path: '/contests',
            config: {
                handler: ContestsController.create
            }
        },
        // Get information about current contest
        {
            method: 'GET',
            path: '/contests/current',
            config: {
                handler: ContestsController.current
            }
        },
        // Get information about previous contest
        {
            method: 'GET',
            path: '/contests/previous',
            config: {
                handler: ContestsController.previous
            }
        },
        /**
        *   @event
        *   @name Routes:contests./contests/next
        *   @desc This event fire to get the next upcoming event
        *   in the globalrockstar
        **/
        {
            method: 'GET',
            path: '/contests/next',
            config: {
                handler: ContestsController.next
            }
        },
        /**
        *   @event
        *   @name Routes:contests./contests/next/participate/slug
        *   @desc This event fire to get the upcoming contest and also
        *   find if the artist has participated in that next contest or not
        **/
        {
            method: 'GET',
            path: '/contests/next/participate/{slug}',
            config: {
                handler: ContestsController.next
            }
        },
        // Get information about running contest
        {
            method: 'GET',
            path: '/contests/running',
            config: {
                handler: ContestsController.running
            }
        },
        // Delete a specific contest
        {
            method: 'DELETE',
            path: '/contests/{id}',
            config: {
                handler: ContestsController.delete
            }
        },
        // Edit a specific contest
        {
            method: 'PUT',
            path: '/contests/{id}',
            config: {
                handler: ContestsController.update
            }
        },
        // Get information about a specific contest phases
        {
            method: 'GET',
            path: '/contests/{id}/phases',
            config: {
                pre: [{method: ContestsController.show, assign: 'contest'}],
                handler: ContestsController.phases
            }
        },
        // Get contestants of a specific contest
        {
            method: 'GET',
            path: '/contest/{id}/contestants',
            config: {
                pre: preSearchQuery,
                handler: ContestsController.contestants
            }
        },
        /**
        *   @event
        *   @name Routes:contests./contest/id/contestants
        *   @desc This event fire to get the current phase of the
        *   contest whose id is passed to it
        *   <p> mehtod GET </p>
        **/
        {
            method: 'GET',
            path: '/contest/{id}/currentPhase',
            config: {
                pre: [{method: ContestsController.show, assign: 'contest'}],
                handler: ContestsController.currentPhase
            }
        }
    ]);
};
