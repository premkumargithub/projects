'use strict';
/**
 * Provides routes for searching with pagination ralated activities
 *
 * @module Routes:Search-Route
 * @requires module:../controllers/search
 */
var SearchController = require('../controllers/search') ;
var prePaginator = require('../lib/pre-paginator') ;

module.exports = function (server) {
    /**
    * @event
    * @name Routes:Search-Route.Get-Search
    * @description <p>path: /search </p>
    * <p><b>operations:</b></p>
    * <p>-  httpMethod: GET</p>
    * <p> summary: Get searched items for request</p>
    * @fires SearchController.search
    * @returns results for the request<br><br><hr>
    **/
    server.route({
        method: 'GET',
        path: '/search',
        handler: SearchController.search,
        config: {
            pre: prePaginator
        }
    }) ;
};
