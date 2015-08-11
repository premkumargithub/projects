'use strict';
/**
 *@module Controller:Albums
 *@description this module is used for albums activities
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:hapi
 *@requires module:../config
 *@requires module:Album
 **/
var mongoose = require('mongoose'),
    Hapi = require('hapi'),
    config = require('../config'),
    reformatErrors = require('../lib/mongoose-hapi-errors'),
    Album = mongoose.model('Album');

module.exports = {
    /**
     * Retrieve information about all the album or about a defined one
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    index: function (req, reply) {

        var albumId = req.params.id,
            promise;

        if (albumId) {
            promise = Album.findOne({_id: albumId}).
                populate('artist').
                populate('tracks').
                exec();
        } else {
            promise = Album.find({}).
                populate('artist').
                populate('tracks').
                exec();
        }

        promise.then(function (album) {
            return reply(album);
        }, function (err) {
            return reply(reformatErrors(err));
        });
    },

    /**
     * Create a new album
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    create: function (req, reply) {
        var album = new Album(req.payload);
        album.save(function (err, savedAlbum) {
            if (!err) {
                savedAlbum.populate('artist tracks', function (err, populatedAlbum) {
                    if (!err) {
                        return reply(populatedAlbum).code(201);
                    }
                    return reply(reformatErrors(err));
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },

    /**
     * update an album
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    update: function (req, reply) {
        delete req.payload.artist;
        Album.findOne({_id: req.params.id}, function (err, album) {
            if (!err) {
                album.safeUpdate(req.payload, 'profile').then(function (album) {
                    album[0].populate('artist tracks', function (err, populatedAlbum) {
                        if (!err) {
                            return reply(populatedAlbum);
                        }
                        return reply(reformatErrors(err));
                    });
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },

    /**
     * delete an album
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    remove: function (req, reply) {

        Album.remove({_id: req.params.id}, function (err) {
            if (!err) {
                return reply();
            }
            return reply(reformatErrors(err));
        });
    }
};
