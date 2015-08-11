'use strict';
/**
 *@module Controller:Videos
 *@description this module is used for support-videos activities
 *@requires module:mongoose
 *@requires module:hapi
 *@requires module:../config
 *@requires ../lib/mongoose-hapi-errors
 *@requires module:Videos
 **/
var mongoose = require('mongoose'),
    Hapi = require('hapi'),
    config = require('../config'),
    reformatErrors = require('../lib/mongoose-hapi-errors'),
    Video = mongoose.model('Video'),
    artistPopulationFields = 'slug name';

module.exports = {
    /**
     * Retrieve information about all the support-videos or about a defined one
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    index: function (req, reply) {
        var videoId = req.params.id,
            promise;

        if (videoId) {
            promise = Video.findOne({_id: videoId}).
                populate('artist', artistPopulationFields).
                populate('contest').
                exec();
        } else {
            promise = Video.find().populate('artist', artistPopulationFields).exec();
        }

        promise.then(function (video) {
            return reply(video);
        }, function (err) {
            return reply(reformatErrors(err));
        });
    },

    /**
     * Retrieve information about videos of a specific artist
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    findByArtist: function (req, reply) {
        var promise = Video.find({artist: req.params.artistId}).
            populate('artist', artistPopulationFields).
            populate('contest').
            exec();

        promise.then(function (video) {
            return reply(video);
        }, function (err) {
            return reply(reformatErrors(err));
        });
    },

    /**
     * Create a new video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    create: function (req, reply) {
        var video = new Video(req.payload);
        video.save(function (err, savedVideo) {
            if (!err) {
                savedVideo.
                    populate('artist', artistPopulationFields).
                    populate('contest', function (err, populatedVideo) {
                    if (!err) {
                        return reply(populatedVideo).code(201);
                    }
                    return reply(reformatErrors(err));
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },

    /**
     * Update a video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    update: function (req, reply) {
        Video.findOne({_id: req.params.id}, function (err, video) {
            if (!err) {
                video.safeUpdate(req.payload,  'admin').then(function (video) {
                    video[0].
                        populate('artist', artistPopulationFields).
                        populate('contest', function (err, populatedVideo) {
                        if (!err) {
                            return reply(populatedVideo);
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
     * Remove a video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    remove: function (req, reply) {
        Video.remove({_id: req.params.id}, function (err) {
            if (!err) {
                return reply();
            }
            return reply(reformatErrors(err));
        });

    }
};
