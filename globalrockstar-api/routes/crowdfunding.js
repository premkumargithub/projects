'use strict';

/**
 * @module Routes:crowdfunding
 *
 * @description Provides routes to read information about crowdfunding
 *
 * @requires module:../lib/pre-paginator
 * @requires module:../lib/pre-sorter
 */

//var preSearchQuery = require('../lib/pre-search-query');
var prePaginator = require('../lib/pre-paginator');
var preSorter = require('../lib/pre-sorter');

module.exports = function (server) {
    var controller = require('../controllers/crowdfunding');

    // Get information about all crowdfunding projects
    server.route([{
        method: 'GET',
        path: '/crowdfunding',
        config: {
            pre: [prePaginator, preSorter /*, preSearchQuery */],
            handler: controller.index
        }
    },
    // Get information about a specific crowdfunding project
    {
        method: 'GET',
        path: '/crowdfunding/{slug}',
        config: {
            handler: controller.detail
        }
    }]);
};
