'use strict';
/**
*   @module Routes:Fans
*   @description Provides routes to create, read, update and delete information about fans
*   @requires module:../controllers/fans
*   @requires module:joi
*   @requires module:../lib/pre-search-query
*   @requires module:pretty-hapi-errors
*   @requires module:../controllers/fans-favorites
*/

var FansController = require('../controllers/fans'),
    Joi = require('joi'),
    preSearchQuery = require('../lib/pre-search-query'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    FansFavoritesController = require('../controllers/fans-favorites');

// Schema to create a new fan
var createSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    country: Joi.string().required(),
    genres: Joi.array().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8),
    password_confirmation: Joi.ref('password'),
    toc: Joi.boolean().required(),
    newsletter: Joi.boolean(),
    invitationToken: Joi.any()
}).options({abortEarly: false});

// Schema to login
var loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
}).options({abortEarly: false});

// Schema to login with facebook data
var facebookLoginSchema = Joi.object({
    facebookId: Joi.string().required(),
    email: Joi.string().email(),
    firstname: Joi.string(),
    lastname: Joi.string()
}).options({abortEarly: false, allowUnknown: true});

// Schema to change
var changePasswordSchema = Joi.object({
    password: Joi.string().required(),
    password_confirmation: Joi.string().required()
}).options({abortEarly: false});

// Schema to update the fan
var updateSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().required(),
    newsletter: Joi.boolean(),
    country: Joi.string(),
    genres: Joi.array().required(),
    file: Joi.object().optional(),
    picture: Joi.alternatives().when('file', {
        is: true,
        then: Joi.string(),
        otherwise: Joi.any()
    }),
    gender: Joi.string(),
    birthdate: Joi.alternatives().when('no_birthdate', {
        is: Joi.boolean().required(),
        then: Joi.any(),
        otherwise: Joi.date().required()
    }),
    no_birthdate: Joi.any()
}).options({abortEarly: false, allowUnknown: true});

// Schema to initialize the fan
var initializeSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().required(),
    newsletter: Joi.boolean(),
    country: Joi.string(),
    file: Joi.object().optional(),
    picture: Joi.alternatives().when('file', {
        is: true,
        then: Joi.string(),
        otherwise: Joi.any()
    }),
    gender: Joi.string(),
    birthdate: Joi.alternatives().when('no_birthdate', {
        is: Joi.boolean().required(),
        then: Joi.any(),
        otherwise: Joi.date().required()
    }),
    no_birthdate: Joi.any()
}).options({abortEarly: false, allowUnknown: true});

// Schema to update settings
var updateSettingsSchema = Joi.object({
    arena: Joi.string().required(),
    currency: Joi.string(),
    newsletter: Joi.boolean(),
    notifications: Joi.boolean(),
    preferredCountry: Joi.string(),
    activitystream: Joi.boolean()
}).options({abortEarly: false});

// Schema verify fan
var verifySchema = Joi.object({
    verified: Joi.date().required()
}).options({allowUnknown: true});

module.exports = function (server) {

    server.route([
        // Get all the fans or a single fan based on {id}
        {
            method: 'GET',
            path: '/fans/{id?}',
            config: {
                pre: preSearchQuery,
                handler: FansController.index
            }
        },
        // Create a new fan
        {
            method: 'POST',
            path: '/fans',
            config: {
                handler: FansController.create,
                validate: {
                    payload: createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update a fan
        {
            method: 'PUT',
            path: '/fans/{id}',
            config: {
                handler: FansController.update,
                validate: {
                    payload: updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Initialize a fan
        {
            method: 'PUT',
            path: '/fans/{id}/initialize',
            config: {
                handler: FansController.update,
                validate: {
                    payload: initializeSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Validate a fan
        {
            method: 'PUT',
            path: '/fans/validate',
            config: {
                handler: function (req, reply) {
                    reply('ok');
                },
                validate: {
                    payload: updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Change a fan's settings
        {
            method: 'PUT',
            path: '/fans/{id}/settings',
            config: {
                handler: FansController.updateBasicSettings,
                validate: {
                    payload: updateSettingsSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update a fan's state
        {
            method: 'PUT',
            path: '/fans/{id}/state',
            config: {
                handler: FansController.stateChange
            }
        },
        // Verify a fan
        {
            method: 'PUT',
            path: '/fans/{id}/verify',
            config: {
                handler: FansController.update,
                validate: {
                    payload: verifySchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update a fan's password
        {
            method: 'PUT',
            path: '/fans/{id}/password',
            config: {
                handler: FansController.update,
                validate: {
                    payload: changePasswordSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Delete a fan
        {
            method: 'DELETE',
            path: '/fans/{id}',
            config: {
                handler: FansController.delete
            }
        },
        // Authenticate a fan
        {
            method: 'POST',
            path: '/fans/authenticate',
            config: {
                handler: FansController.authenticate,
                validate: {
                    payload: loginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Authenticate and validate a fan
        {
            method: 'POST',
            path: '/fans/authenticate/validate',
            config: {
                handler: FansController.authenticateValidate,
                validate: {
                    payload: loginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Authenticate a fan with facebook data
        {
            method: 'POST',
            path: '/fans/facebook_authenticate',
            config: {
                handler: FansController.facebook_authenticate,
                validate: {
                    payload: facebookLoginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Fans.Get-Favourite-SOngs
        *   @description <p>path: /fans/{id}/favorite-songs </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Gets all Favorite Songs for a fan user</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> fanID: req.params.id</li>
        *   </ul>
        *   @fires FansFavoritesController.favoriteSongs
        *   @returns Favorite Songs objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/fans/{id}/favorite-songs',
            config: {
                pre: FansFavoritesController.setFanAndArtists.concat(preSearchQuery),
                handler: FansFavoritesController.favoriteSongs
            }
        },
        // Get all the favourite artists of a fan
        {
            method: 'GET',
            path: '/fans/{id}/favorite-artists',
            config: {
                pre: FansFavoritesController.setFan.concat(preSearchQuery),
                handler: FansFavoritesController.favoriteArtists
            }
        },
        /**
        *   @event
        *   @name Routes:Fans.Get-Statistics
        *   @description <p>path: /fans/{id}/statistics </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Gets all the statistics for a fan user</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> fanID: req.params.id</li>
        *   </ul>
        *   @fires FansController.statistics
        *   @returns statistics objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/fans/{id}/statistics',
            config: {
                handler: FansController.statistics
            }
        },
        // Get fans of a specific artist given the artist's {slug}
        {
            method: 'GET',
            path: '/fans/{slug}/fan-of-artist',
            config: {
                handler: FansController.getFanOfArtist
            }
        },
        /**
        *   @event
        *   @name Routes:fans./fan/id/stats/count
        *   @desc This event fire to call the detail function of
        *   fanscontroller
        **/
        {
            method: 'GET',
            path: '/fans/{id}/stats/count',
            config: {
                handler: FansController.detail
            }
        },
        /**
        *   @name Routes:Fans.Get-Songs
        *   @description <p>path: /fans/{id}/songs </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Gets all purchased songs for a fan user</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> fanID: req.params.id</li>
        *   </ul>
        *   @fires FansController.getSongs
        *   @returns songs objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/fans/{id}/songs',
            config: {
                handler: FansController.getSongs
            }
        },
        /**
        *   @event
        *   @name Routes:fans./fan/id/follow
        *   @desc This event fire to call the detail function of
        *   fanscontroller
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> id: req.params.id</li>
        *   </ul>
        *   @fires FansController.getArtistsDetail
        **/
        {
            method: 'GET',
            path: '/fans/{id}/follow',
            config: {
                handler: FansController.getArtistsDetail
            }
        },
        /**
        *   @name Routes:Fans.Get-Physical-Products
        *   @description <p>path: /fans/{id}/physical-products </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Gets all the purchased products for a fan user</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> fanID: req.params.id</li>
        *   </ul>
        *   @fires FansController.getPhysicalProducts
        *   @returns PhysicalProducts objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/fans/{id}/physical-products',
            config: {
                handler: FansController.getPhysicalProducts
            }
        },
        /**
        *   @event
        *   @name Routes:fans./fan/id/fan-favorite-artists
        *   @desc This event fire to get the detail of all the artist for
        *   which fan give a vote
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> id: req.params.id</li>
        *   </ul>
        *   @fires FansController.getFavoriteArtists
        **/
        {
            method: 'GET',
            path: '/fans/{id}/fan-favorite-artists',
            config: {
                handler: FansController.getFavoriteArtists
            }
        },
        /**
        *   @event
        *   @name Routes:Fans.Get-Albums
        *   @description <p>path: /fans/{id}/albums </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Gets all purchased albums for a fan user</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> fanID: req.params.id</li>
        *   </ul>
        *   @fires FansController.getAlbums
        *   @returns albums objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/fans/{id}/albums',
            config: {
                handler: FansController.getAlbums
            }
        },
        /**
        *   @event
        *   @name Routes:Fans.Get-Stats
        *   @description <p>path: /fans/{id}/stats </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Gets all stats for a fan user</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> fanID: req.params.id</li>
        *   </ul>
        *   @fires FansController.getStats
        *   @returns stats objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/fans/{id}/stats',
            config: {
                handler: FansController.getStats
            }
        }

    ]);
};
