'use strict';
/**
 * Provides routes to retrieve and modify video data.
 *
 * @module Routes:Video-Route
 */

var mongoose = require('mongoose'),
    VideoController = require('../controllers/videos'),
    Hapi = require('hapi'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    Artist = mongoose.model('Artist'),
    videoValidation = require('../validations/video-schema');

module.exports = function (server) {

    server.route([

    /**
     * Get all the videos or a specific one
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'GET',
            path: '/videos/{id?}',
            config: {
                handler: VideoController.index
            }
        },

        /**
         * Get all the videos or a specific one
         *
         * @param {object} req - Request object
         * @param {function} reply - hapi reply interface
         */
        {
            method: 'GET',
            path: '/artists/{artistId}/videos/{id?}',
            config: {
                handler: VideoController.findByArtist
            }
        },

    /**
     * Create a resource for youtube video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'POST',
            path: '/videos/youtube',
            config: {
                handler: VideoController.create,
                validate: {
                    payload: videoValidation.createYoutubeSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },

    /**
     * Create a resource for GlobalRockstar video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'POST',
            path: '/videos/globalrockstar',
            config: {
                handler: VideoController.create,
                validate: {
                    payload: videoValidation.createGlobalRockstarSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },


    /**
     * Update a youtube video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'PUT',
            path: '/videos/youtube/{id}',
            config: {
                handler: VideoController.update,
                validate: {
                    payload: videoValidation.updateYoutubeSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },

    /**
     * Update a globalrockstar video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'PUT',
            path: '/videos/globalrockstar/{id}',
            config: {
                handler: VideoController.update,
                validate: {
                    payload: videoValidation.updateGlobalrockstarSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },

    /**
     * Remove a youtube video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'DELETE',
            path: '/videos/youtube/{id}',
            config: {
                handler: VideoController.remove
            }
        },

    /**
     * Remove a globalrockstar video
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'DELETE',
            path: '/videos/globalrockstar/{id}',
            config: {
                handler: VideoController.remove
            }
        }

    ]);
};