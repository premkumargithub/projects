/**
 * Provides routes for songs related activities.
 *
 * @module Routes:Songs-Route
 * @requires module:mongoose
 * @requires module:Artist
 * @requires module:Song
 * @requires module:hapi
 * @requires module:../controllers/songs
 * @requires module:../lib/pre-search-query
 * @requires module:pretty-hapi-errors
 * @requires module:../validations/song-schema
 */

var mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Song = mongoose.model('Song'),
    Hapi = require('hapi'),
    SongsController = require('../controllers/songs'),
    preSearchQuery = require('../lib/pre-search-query'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    songSchema = require('../validations/song-schema');

module.exports = function (server) {
    /**
     * @name Routes:Songs-Route.setArtist
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It checks artist Id type(Regression) and Sets the astiist
     * @callback {Request} reply
     *
     */
    var setArtist = function (req, reply) {
        //Selects single artist
        Artist.findOne({_id: req.params.artistId}, '_id name slug picture country', function (err, artist) {
            if (artist) {
                return reply(artist);
            }
            return reply(Hapi.error.notFound);
        });
    };

    /**
     * @name Routes:Songs-Route.findSong
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It checks artist Id type(Regression) and Sets the astiist
     * @callback {Request} reply
     */
    var findSong = function (req, reply) {
        // check if have id in the param
        if (!req.params.id) {
            return reply();
        }

        // setting the or condition in the query
        var query = {
            $or: [{slug: req.params.id}]
        };
        // pushing the id in the or condition
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }
        //Retrieve single song from Song model
        // Get the song detail with the artist and the contest detail
        Song.findOne(query)
            .populate('artist', '-hashedPassword -salt')
            .populate('contest', '_id name arenaLocked currentPhase nextPhase cfe.time np.time globalfinalsQualification.time globalfinalsBest64.time globalfinalsBest16.time')
            .exec(function (err, song) {
                if (err) {
                    return reply(err);
                }
                if (!song) {
                    return reply(Hapi.error.notFound());
                }
                reply(song);
            });
    };

    /**
     * @event
     * @name Routes:Projects-Route.Get-Songs
     * @description <p>path: /songs </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p> summary: Get songs result for admin user</p>
     * @fires SongsController.index
     * @returns songs object for admin request<br><br><hr>
     **/
    server.route([
        {
            method: 'GET',
            path: '/songs',
            config: {
                pre: preSearchQuery,
                handler: SongsController.index
            }
        },
        // Get all the artist's songs or a specific artist's song
        {
            method: 'GET',
            path: '/artists/{artistId}/songs/{id?}',
            config: {
                pre: [{
                    method: setArtist,
                    assign: 'artist'
                }, {
                    method: findSong,
                    assign: 'song'
                }, preSearchQuery[0]],
                handler: SongsController.index
            }
        },
        // Add a new song of an artist
        {
            method: 'POST',
            path: '/artists/{artistId}/songs',
            config: {
                pre: [{method: setArtist, assign: 'artist'}],
                handler: SongsController.create,
                validate: {
                    payload: songSchema.createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Add an artist's song and allow it to participate to the contest
        {
            method: 'POST',
            path: '/artists/{artistId}/songs/participate',
            config: {
                pre: [{method: setArtist, assign: 'artist'}],
                handler: SongsController.create,
                validate: {
                    payload: songSchema.createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Get-Song
     * @description <p>path: /songs/{id} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> songId: req.params.id</li>
     * </ul>
     * <p> summary: Gets specific song's result for admin user</p>
     * @fires SongsController.show
     * @returns {Object} Song's result <br><br><hr>
     **/
        {
            method: 'GET',
            path: '/songs/{id}',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.show
            }
        },
        // Get a song by id
        {
            method: 'PUT',
            path: '/songs/{id}',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.update,
                validate: {
                    payload: songSchema.updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Change the rating of a song
        {
            method: 'PUT',
            path: '/songs/{id}/rating',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.update
            }
        },
        // Allow an artist's song to participate to the contest
        {
            method: 'PUT',
            path: '/songs/{id}/participate',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.update,
                validate: {
                    payload: songSchema.updateParticipateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Delete a song
        {
            method: 'PUT',
            path: '/songs/{id}/delete',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.update,
                validate: {
                    payload: songSchema.deleteSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.update-Song
     * @description <p>path: /songs/{id}/flag </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> songId: req.params.id</li>
     * </ul>
     * <p> summary: Update song based on Id </p>
     * @fires SongsController.update
     **/
        {
            method: 'PUT',
            path: '/songs/{id}/flag',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.update,
                validate: {
                    payload: songSchema.flagSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Get-Songs-Count
     * @description <p>path: /songs/count </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p> summary: Counts the song's result for admin user</p>
     * @fires SongsController.count
     * @returns {Integer} Number of songs <br><br><hr>
     **/
        {
            method: 'GET',
            path: '/songs/count',
            config: {
                handler: SongsController.count
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Count-Song
     * @description <p>path: /artists/{artistId}/songs/count </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * </ul>
     * <p> summary: Count artists song based on Id </p>
     * @fires SongsController.count
     **/
        {
            method: 'GET',
            path: '/artists/{artistId}/songs/count',
            config: {
                pre: [{method: setArtist, assign: 'artist'}],
                handler: SongsController.count
            }
        },
        // Get contest's metadata related to a specific song (seems not working)
        {
            method: 'GET',
            path: '/songs/{id}/contest-meta',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.contestMeta
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Active-Song
     * @description <p>path: /artists/{artistId}/songs/active </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * </ul>
     * <p> summary: Make active artists song based on Id </p>
     * @fires SongsController.active
     **/
        {
            method: 'GET',
            path: '/artists/{artistId}/songs/active',
            config: {
                pre: [{method: setArtist, assign: 'artist'}],
                handler: SongsController.active
            }
        },
        // Get all the nominated songs about an artist
        {
            method: 'GET',
            path: '/artists/{artistId}/songs/nominated',
            config: {
                pre: [{method: setArtist, assign: 'artist'}],
                handler: SongsController.nominated
            }
        },
        // Count all the nominated songs about an artist
        {
            method: 'GET',
            path: '/artists/{artistId}/songs/nominatedCount',
            config: {
                pre: [{method: setArtist, assign: 'artist'}],
                handler: SongsController.nominatedCount
            }
        },
        // TODO: I think that we may remove this one (also the controller)
        // Verify that a song with a specific youtube URL doesn't already exists
        {
            method: 'POST',
            path: '/artists/{artistId}/songs/validate',
            config: {
                pre: [{method: setArtist, assign: 'artist'}],
                handler: SongsController.validate,
                validate: {
                    payload: songSchema.createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // TODO: I think that we may remove this one (also the controller)
        // Just reply ok
        {
            method: 'POST',
            path: '/songs/validate',
            config: {
                handler: function (req, reply) {
                    reply('ok');
                },
                validate: {
                    payload: songSchema.createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // TODO: I think that we may remove this one (also the controller)
        // Just reply ok and say 'yay'
        {
            method: 'POST',
            path: '/songs/participate/validate',
            config: {
                handler: function (req, reply) {
                    console.log('yay');
                    reply('ok');
                },
                validate: {
                    payload: songSchema.participateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Validate-Song
     * @description <p>path: /songs/validate </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: POST</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> songId: req.params.id</li>
     * </ul>
     * <p> summary: Validate a song based on Id </p>
     * @fires SongsController.validate
     **/
        {
            method: 'PUT',
            path: '/songs/validate',
            config: {
                handler: function (req, reply) {
                    reply('ok');
                },
                validate: {
                    payload: songSchema.updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Nominate-Song
     * @description <p>path: /songs/{id}/nominate </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: POSt</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> songId: req.params.id</li>
     * </ul>
     * <p> summary: Nominate a song based on Id </p>
     * @fires SongsController.nominate
     **/
        {
            method: 'POST',
            path: '/songs/{id}/nominate',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.nominate
            }
        },
        // Clear nominations of a song
        {
            method: 'PUT',
            path: '/artists/{artistId}/songs/clearNominations',
            handler: SongsController.clearNominations
        },
        // Change state of a song
        {
            method: 'PUT',
            path: '/songs/{id}/state',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.stateChange
            }
        },
        /**
        *   @event
        *   @name /songs/id/played
        *   @desc fire when any user or artist play the song
        **/
        {
            method: 'PUT',
            path: '/songs/{id}/played',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.played
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Delete-Song
     * @description <p>path: /songs/{id} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> songId: req.params.id</li>
     * </ul>
     * <p> summary: Deletes song based on Id </p>
     * @fires SongsController.delete
     **/
        {
            method: 'DELETE',
            path: '/songs/{id}',
            config: {
                pre: [{method: findSong, assign: 'song'}],
                handler: SongsController.delete
            }
        },
    /**
     * @event
     * @name Routes:Projects-Route.Get-Arena-Songs
     * @description <p>path: /songs/arena/{contestId} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> contestId: req.params.contestId</li>
     * </ul>
     * <p> summary: Gets arena songs based on the contest Id </p>
     * @fires SongsController.arena
     **/
        {
            method: 'GET',
            path: '/songs/arena/{contestId}',
            config: {
                handler: SongsController.arena
            }
        }
    ]);
};
