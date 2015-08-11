'use strict';

/**
 * @module Controller:fans-favourite
 *
 * @description Provides information about fans' favorite artists
 *
 * @requires module:mongoose
 * @requires module:hapi
 * @requires module:lodash
 *
 */
var mongoose = require('mongoose');
var Fan = mongoose.model('Fan');
var Artist = mongoose.model('Artist');
var Song = mongoose.model('Song');
var Hapi = require('hapi');
var _ = require('lodash');

/**
 * Find a fan
 */
module.exports.setFan = [{
    method: function (req, reply) {
        var query = {$or: [{slug: req.params.id}]};
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }

        Fan.findOne(query, function (err, fan) {
            if (fan) {
                return reply(fan);
            }
            return reply(Hapi.error.notFound);
        });
    },
    assign: 'fan'
}];


/**
 * Get a fan's favourite artist
 *
 * @param {object} req - Request object
 * @param {function} reply - hapi reply interface
 */
module.exports.favoriteArtists = function (req, reply) {
    var fan = req.pre.fan;
    var search = req.pre.search || {};
    console.log(search);

    search.fans = {$in: [fan._id]};

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

/**
 * Export method favoriteArtists to be used as a pre-query
 */
module.exports.setFanAndArtists = [
    module.exports.setFan[0],
    {
        method: module.exports.favoriteArtists,
        assign: 'artists'
    }
];

/**
 * Get a fan's favourite song
 *
 * @param {object} req - Request object
 * @param {function} reply - hapi reply interface
 */
module.exports.favoriteSongs = function (req, reply) {
    var favoriteArtists = req.pre.artists;
    var search = req.pre.search || {};
    search.artist = {$in: _.pluck(favoriteArtists, '_id')};

    Song.find(search).exec(function (err, res) {
        if (err) {
            return reply(err);
        }
        reply(res);
    });
};
