var Hapi = require('hapi'),
    Artist = require('../models/artist'),
    SupportVideosController = require('../controllers/support-videos'),
    Joi = require('joi'),
    preSearchQuery = require('../lib/pre-search-query'),
    PrettyHapiErrors = require('pretty-hapi-errors');

var createSchema = Joi.object().keys({
    youtubeUrl: Joi.string(),
    category: Joi.string(),
    state: Joi.any()
}).or('youtubeUrl', 'state').options({abortEarly: false});

var updateSchema = Joi.object().keys({
    youtubeUrl: Joi.string(),
    category: Joi.string()
}).or('youtubeUrl', 'state').options({abortEarly: false, allowUnknown: true});

var flagSchema = Joi.object({
    flagged_date: Joi.date(),
    flagged: Joi.boolean(),
    'flagged_reason': Joi.string()
}).options({abortEarly: false});

module.exports = function (server) {
    var setArtist = function (req, next) {
        var query = {$or: [{slug: req.params.artistId}]};
        if (req.params.artistId.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.artistId});
        }

        Artist.findOne(query, '_id name slug picture', function (err, artist) {
            if (artist) {
                return next(null, artist);
            }
            next(null, Hapi.error.notFound());
        });
    };

    var preConfig = [
        {method: setArtist, assign: 'artist'}
    ];

    server.route([
        {
            method: 'GET',
            path: '/support-videos',
            config: {
                pre: preSearchQuery,
                handler: SupportVideosController.index
            }
        },
        {
            method: 'GET',
            path: '/support-videos/count',
            config: {
                handler: SupportVideosController.count
            }
        },
        {
            method: 'GET',
            path: '/support-videos/{id}',
            config: {
                handler: SupportVideosController.show
            }
        },
        {
            method: 'POST',
            path: '/support-videos/validate',
            config: {
                handler: function (req, reply) {
                    reply('ok');
                },
                validate: {
                    payload: createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        {
            method: 'PUT',
            path: '/support-videos/validate',
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
        {
            method: 'GET',
            path: '/artists/{artistId}/support-videos/{id?}',
            config: {
                pre: [
                    {method: setArtist, assign: 'artist'},
                    preSearchQuery[0]
                ],
                handler: SupportVideosController.index
            }
        },
        {
            method: 'GET',
            path: '/artists/{artistId}/support-videos/count',
            config: {
                pre: preConfig,
                handler: SupportVideosController.count
            }
        },
        {
            method: 'POST',
            path: '/artists/{artistId}/support-videos',
            config: {
                pre: preConfig,
                handler: SupportVideosController.create,
                validate: {
                    payload: createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        {
            method: 'PUT',
            path: '/support-videos/{id}/state',
            config: {
                handler: SupportVideosController.stateChange
            }
        },
        {
            method: 'PUT',
            path: '/support-videos/{id}',
            config: {
                handler: SupportVideosController.update,
                validate: {
                    payload: updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        {
            method: 'PUT',
            path: '/support-videos/{id}/flag',
            config: {
                handler: SupportVideosController.update,
                validate: {
                    payload: flagSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        {
            method: 'DELETE',
            path: '/support-videos/{id}',
            config: {
                handler: SupportVideosController.delete
            }
        }
    ]);
};
