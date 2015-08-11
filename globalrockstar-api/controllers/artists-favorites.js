'use strict';

/**
 * @module Controller:artists-favourites
 *
 * @description Provides information about favourite artists
 *
 * @requires module:mongoose
 * @requires module:hapi
 */
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var Hapi = require('hapi');

/**
 * Array having an object composed by method (function to execute) and assign (name assigned to the result)
 * to be passed to hapi's route prerequisite (pre)
 *
 */
module.exports.setArtist = [{
    /**
     * Find an artist
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    method: function (req, reply) {
        // FIXME: req.params.id assigned to slug (this happens in many places, maybe it's an old fix?)
        var query = {$or: [{slug: req.params.id}]};
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }

        Artist.findOne(query, function (err, fan) {
            if (fan) {
                return reply(fan);
            }
            return reply(Hapi.error.notFound);
        });
    },
    assign: 'artist'
}];


/**
 * Get favourite artist of an artist
 *
 * @param {object} req - Request object
 * @param {function} reply - hapi reply interface
 */
module.exports.favoriteArtists = function (req, reply) {
    var artist = req.pre.artist;
    var search = req.pre.search || {};

    search.fans_a = {$in: [artist._id]};

    var query = Artist.find(search);
    if (req.query.fields) {
        query = query.select(req.query.fields.replace(',', ' '));
    }
    query.exec(function (err, res) {
        if (err) {
            return reply(err);
        }
        reply(res);
    });
};
