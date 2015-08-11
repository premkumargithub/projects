'use strict';

/**
 * @module Controller:media-libraries
 *
 * @description Provides information users (fans and artists) media libraries
 *
 * @requires module:mongoose
 * @requires module:q
 *
 */
var mongoose = require('mongoose');
var MediaLibrary = mongoose.model('MediaLibrary');
var Q = require('q');

module.exports = function (type) {
    return {
        /**
         * Get the media library of a fan or an artist depending on type parameter
         *
         * @param {object} req - Request object
         * @param {function} reply - hapi reply interface
         */
        detail: function (req, reply) {
            Q.ninvoke(MediaLibrary.findOne({'userId': req.params.id, 'userType': type}).populate('songs'), 'exec')
                .then(function (medias) {
                    return Q.ninvoke(MediaLibrary, 'populate', medias, [{path: 'songs.artist', model: 'Artist'}]);
                })
                .then(reply)
                .fail(function (err) {
                    console.error(err);
                    console.error(err.stack);
                    reply(err);
                });
        }
    };
};
