'use strict';

/**
 * @module Routes:content
 *
 * @description Provides routes to create, read, update and delete information about contents
 *
 * @requires module:../controllers/contents
 * @requires module:pretty-hapi-errors
 * @requires module:joi
 * @requires module:../lib/pre-search-query
 */

var ContentController = require('../controllers/contents'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    Joi = require('joi'),
    preSearchQuery = require('../lib/pre-search-query');

var createSchema = Joi.object({
    title: Joi.string().required(),
    text: Joi.string().required()
}).options({abortEarly: false, allowUnknown: true});


module.exports = function (server) {
    server.route([
        // Get objects containing HTML content
        {
            method: 'GET',
            path: '/contents',
            handler: ContentController.index,
            config: {
                pre: preSearchQuery
            }
        },
        // Create objects containing HTML content
        {
            method: 'POST',
            path: '/contents',
            handler: ContentController.create,
            config: {
                validate: {
                    payload: createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Get a specific content object based on the {id} param
        {
            method: 'GET',
            path: '/contents/{id}',
            config: {
                handler: ContentController.show
            }
        },
        // Modify or delete a specific content object based on the {id} param
        {
            method: 'PUT',
            path: '/contents/{id}',
            config: {
                handler: ContentController.update,
                validate: {
                    payload: createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Delete a specific content object based on the {id} param
        {
            method: 'DELETE',
            path: '/contents/{id}',
            config: {
                handler: ContentController.delete
            }
        }
    ]);
};
