'use strict';
/**
 * Provides routes for team ralated activities in GlobalRockstar Admin section
 *
 * @module Routes:Team-Route
 * @requires module:mongoose
 * @requires module:Artist
 * @requires module:Fan
 * @requires module:q
 * @requires module:lodash
 */
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var Fan = mongoose.model('Fan');
var Q = require('q');
var _ = require('lodash');

module.exports = function (server) {
    var dataCache = {}; //TODO: Need to remove
    /**
     * @event
     * @name Routes:Team.Get-Team
     * @description <p>path: /team </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p> summary: Get team list</p>
     * @callback Requester~requestCallback: reply
     **/
    server.route([{
        method: 'GET',
        path: '/team',
        /**
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description Handeling fired event for this route
         * @callback Requester~requestCallback: reply
         */
        handler: function (req, reply) {
            var sortBy = req.query.sort || "gr_position";

            var artistFinder = Artist.find({
                gr_position: {
                    $exists: true,
                    $ne: ''
                }
            }).select('_id gr_position gr_order country email slug picture name fans fans_a').sort(sortBy);
            var fanFinder = Fan.find({
                gr_position: {
                    $exists: true,
                    $ne: ''
                }
            }).select('_id country gr_position gr_order email firstname lastname slug picture').sort(sortBy);

            Q.all([
                Q.ninvoke(artistFinder, 'exec'),
                Q.ninvoke(fanFinder, 'exec')
            ]).spread(function (artists, fans) {

                reply(_.chain([
                    artists.map(function (artist) {
                        var a = artist.toObject();
                        a.type = 'artist';
                        return a;
                    }),
                    fans.map(function (fan) {
                        var f = fan.toObject();
                        f.type = 'fan';
                        return f;
                    })
                ]).flatten().sortBy(function (el) {
                    return el.gr_order;
                }).value());
            }).fail(function (err) {
                console.log(err);

            });

        }
    }]);
};


