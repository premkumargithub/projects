'use strict';

/**
 * @module Routes:charts
 *
 * @description Provides routes to create, read, update and delete information about charts
 *
 * @requires module:../controllers/charts
 * @requires module:../lib/pre-search-query
 * @requires module:../lib/pre-paginator
 */

var ChartsController = require('../controllers/charts'),
    preSearchQuery = require('../lib/pre-search-query'),
    prePaginator = require('../lib/pre-paginator');

module.exports = function (server) {

    server.route([
        // Get charts of a specific contest
        {
            method: 'GET',
            path: '/contests/{contest_id}/charts',
            handler: ChartsController.index,
            config: {
                cache: {
                    privacy: 'public',
                    expiresIn: 60 * 1000
                },
                pre: preSearchQuery.concat(prePaginator)
            }
        },
        // Get all the wildcard artists of a specific contest
        {
            method: 'GET',
            path: '/contests/{contest_id}/wildcards',
            handler: ChartsController.wildcards,
            config: {
                pre: preSearchQuery.concat(prePaginator)
            }
        },
        // Get a specific chart position
        {
            method: 'GET',
            path: '/charts/{id}',
            handler: ChartsController.show
        },
        // Update a specific chart position
        {
            method: 'PUT',
            path: '/charts/{id}',
            handler: ChartsController.update
        },
        // Get the charts for the current contest
        {
            method: 'GET',
            path: '/contests/current/charts',
            handler: ChartsController.current,
            config: {
                cache: {
                    privacy: 'public',
                    expiresIn: 60 * 1000
                },
                pre: preSearchQuery.concat(prePaginator)
            }
        },
        // Get the charts for the previous contest
        {
            method: 'GET',
            path: '/contests/previous/charts',
            handler: ChartsController.previous,
            config: {
                pre: preSearchQuery.concat(prePaginator)
            }
        }
    ]);
};
