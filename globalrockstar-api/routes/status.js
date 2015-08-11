'use strict';
/**
 * Provides routes for Status ralated activities in GlobalRockstar Admin section
 *
 * @module Routes:Status-Route
 * @requires module:../controllers/sliders
 * @requires module:../lib/pre-search-query
 */
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');

module.exports = function (server) {
    /**
     * @event
     * @name Routes:Status.Get-Status
     * @description <p>path: /status </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p> summary: Get connection status</p>
     * @callback Requester~requestCallback: reply
     **/
    server.route([{
        method: 'GET',
        path: '/status',
        handler: function (req, reply) {
            /**
             * @param {object} req - Request object
             * @param {interface} reply - hapi reply interface
             * @description Handeling fired event for this route
             * @callback Requester~requestCallback: reply
             */
            var dbConnection = mongoose.connection.readyState;
            Artist.count({}).exec(function (err, count) {
                if (dbConnection && count) {
                    reply({status: 'ok'});
                } else {
                    reply({status: 'err'}).code(404);
                }
            });
        }
    }]);
};
