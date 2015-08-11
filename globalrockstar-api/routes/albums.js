'use strict';
/**
 * Provides routes to retrieve and modify album data.
 *
 * @module Routes:Albums-Route
 */

var mongoose = require('mongoose'),
    AlbumsController = require('../controllers/albums'),
    Hapi = require('hapi'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    albumSchema = require('../validations/album-schema');


module.exports = function (server) {

    server.route([

    /**
     * Get all the albums or a specific one
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'GET',
            path: '/albums/{id?}',
            config: {
                handler: AlbumsController.index
            }
        },

    /**
     * Create a new album
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'POST',
            path: '/albums',
            config: {
                handler: AlbumsController.create,
                validate: {
                    payload: albumSchema.createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },

    /**
     * Update an album
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'PUT',
            path: '/albums/{id}',
            config: {
                handler: AlbumsController.update,
                validate: {
                    payload: albumSchema.updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },

    /**
     * Remove an album
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
        {
            method: 'DELETE',
            path: '/albums/{id}',
            config: {
                handler: AlbumsController.remove
            }
        }
    ]);
};