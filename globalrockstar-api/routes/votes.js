/**
 * Provides routes for vote ralated activities.
 *
 * @module Routes:Vote-Route
 * @requires module:../lib/pre-search-query
 */
var preSearchQuery = require('../lib/pre-search-query'),
    VotesController = require('../controllers/votes');

module.exports = function (server) {
    /**
     * @event
     * @name Routes:Payments-Route.Create-Vote
     * @description <p>path: /votes </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: POSt</p>
     * <p> summary: Get the list of votes </p>
     * @fires VotesController.create
     * @returns Votes result for admin request<br><br><hr>
     **/
    server.route([{
        method: 'POST',
        path: '/votes',
        config: {
            handler: VotesController.create
        }
    },
    /**
     * @event
     * @name Routes:Payments-Route.Update-Vote
     * @description <p>path: /votes/{id} </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> voteId: req.params.id</li>
     * </ul>
     * <p> summary: Update the vote record based on the vote id </p>
     * @fires VotesController.update
     * @returns Vote's result for a specific Id request<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/votes/{id}',
            config: {
                handler: VotesController.update
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Delete-Vote
     * @description <p>path: /votes/{id} </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> voteId: req.params.id</li>
     * </ul>
     * <p> summary: Update the vote record based on the vote id </p>
     * @fires VotesController.update
     * @returns Vote's result for a specific Id request<br><br><hr>
     **/
        {
            method: 'DELETE',
            path: '/votes/{id}',
            config: {
                handler: VotesController.delete
            }
        }]);

    /**
     * @event
     * @name Routes:Payments-Route.Get-Votes
     * @description <p>path: /votes/{id} </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p> summary: Update the vote record based on the vote id </p>
     * @fires VotesController.index
     * @returns Vote's result for a specific Id request<br><br><hr>
     **/
    server.route([{
        method: 'GET',
        path: '/votes',
        config: {
            pre: preSearchQuery,
            handler: VotesController.index
        }
    },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Vote
     * @description <p>path: /votes/{id} </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> voteId: req.params.id</li>
     * </ul>
     * <p> summary: Get the vote record based on the vote id </p>
     * @fires VotesController.show
     * @returns Vote's result for a specific Id request<br><br><hr>
     **/
        {
            method: 'GET',
            path: '/votes/{id}',
            config: {
                handler: VotesController.show
            }
        }]);
};
