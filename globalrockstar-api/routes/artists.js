'use strict';
/**
*   @module Routes:artists
*   @description Provides routes to create, read,
*   update and delete most of the available information about artists
*
*   @requires module:../controllers/artists
*   @requires module:../controllers/artist-detail
*   @requires module:../controllers/artists-favorites
*   @requires module:pretty-hapi-errors
*   @requires module:../lib/pre-search-query
*   @requires module:../validations/artist-schema
*
*
*/
var ArtistsController = require('../controllers/artists'),
    ArtistDetailController = require('../controllers/artist-detail'),
    ArtistsFavoritesController = require('../controllers/artists-favorites'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    preSearchQuery = require('../lib/pre-search-query'),
    artistSchema = require('../validations/artist-schema');

module.exports = function (server) {

    server.route([
        /**
        *   @event
        *   @name Routes:artists./artists/id/detail/songId
        *   @desc In this event we find all the detial related to the artist
        **/
        {
            method: 'GET',
            path: '/artists/{id}/detail/{songId?}',
            config: {
                handler: ArtistDetailController.detail,
                pre: [{method: ArtistDetailController.findArtist, assign: 'artist'}]
            }
        },
        /**
        *   @event
        *   @name Routes:artists./artists/id/media
        *   @desc This api is used to get the song and video
        *   of the artist
        **/
        {
            method: 'GET',
            path: '/artists/{id}/media',
            config: {
                handler: ArtistDetailController.getArtistSongs,
                pre: [{method: ArtistDetailController.findArtist, assign: 'artist'}]
            }
        },
        // Get statistics about a specific user based by its {slug}
        {
            method: 'GET',
            path: '/artists/{id}/detail-stats/{songId?}',
            config: {
                handler: ArtistDetailController.detailStats,
                pre: [{method: ArtistDetailController.findArtist, assign: 'artist'}]
            }
        },
        // Get all artists or a specific one based on /{id} param
        {
            method: 'GET',
            path: '/artists/{id?}',
            config: {
                pre: preSearchQuery,
                handler: ArtistsController.index
            }
        },
        // Get total plays of an artist
        {
            method: 'GET',
            path: '/artists/{id}/plays',
            config: {
                handler: ArtistsController.totalPlays
            }
        },
        // Get generic metadata of an user
        {
            method: 'GET',
            path: '/artists/{id}/contest-meta',
            config: {
                handler: ArtistsController.contestMeta
            }
        },
        // Get only users where the fields active and isCompleted are set to true
        {
            method: 'GET',
            path: '/artists/active',
            config: {
                handler: ArtistsController.active
            }
        },
        // Add a new artist
        {
            method: 'POST',
            path: '/artists',
            config: {
                handler: ArtistsController.create,
                validate: {
                    payload: artistSchema.createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update an artist profile
        {
            method: 'PUT',
            path: '/artists/{id}',
            config: {
                handler: ArtistsController.update,
                validate: {
                    payload: artistSchema.updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update an admin artist profile
        {
            method: 'PUT',
            path: '/admin/artists/{id}',
            config: {
                handler: ArtistsController.update,
                validate: {
                    payload: artistSchema.updateAdminSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update artist's settings
        {
            method: 'PUT',
            path: '/artists/{id}/settings',
            config: {
                handler: ArtistsController.updateBasicSettings,
                validate: {
                    payload: artistSchema.updateSettingsSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Validate initial user data
        {
            method: 'POST',
            path: '/artists/validate',
            config: {
                handler: function (req, reply) {
                    reply('ok');
                },
                validate: {
                    payload: artistSchema.createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Validate existent user data
        {
            method: 'PUT',
            path: '/artists/validate',
            config: {
                handler: function (req, reply) {
                    reply('ok');
                },
                validate: {
                    payload: artistSchema.updateSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name /artists/id/fan
        *   @param id {integer} - unique id for the artist
        **/
        {
            method: 'POST',
            path: '/artists/{id}/fan',
            config: {
                // call the function fan of artist controller
                handler: ArtistsController.fan,
                validate: {
                    // create the schema for the fan
                    payload: artistSchema.fanSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update the active state of an artist
        {
            method: 'PUT',
            path: '/artists/{id}/state',
            config: {
                handler: ArtistsController.stateChange
            }
        },
        // Update the artist's features
        {
            method: 'PUT',
            path: '/artists/{id}/feature',
            config: {
                handler: ArtistsController.update
            }
        },
        // Update the paypal account of an artist
        {
            method: 'PUT',
            path: '/artists/{id}/update-paypal-account',
            config: {
                handler: ArtistsController.updatePayPalAccount
            }
        },
        // Update notifications and activitystream of an artist
        {
            method: 'PUT',
            path: '/artists/{id}/verify',
            config: {
                handler: ArtistsController.verify,
                validate: {
                    payload: artistSchema.verifySchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Update the password of an artist
        {
            method: 'PUT',
            path: '/artists/{id}/password',
            config: {
                handler: ArtistsController.update,
                validate: {
                    payload: artistSchema.changePasswordSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Delete a specific user based on the {id} parameter
        {
            method: 'DELETE',
            path: '/artists/{id}',
            config: {
                handler: ArtistsController.delete
            }
        },
        // Authenticate an artist
        {
            method: 'POST',
            path: '/artist/authenticate',
            config: {
                handler: ArtistsController.authenticate,
                validate: {
                    payload: artistSchema.loginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Authenticate an artist
        {
            method: 'POST',
            path: '/artists/authenticate',
            config: {
                handler: ArtistsController.authenticate,
                validate: {
                    payload: artistSchema.loginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // authenticate an artist
        // TODO: what's the difference with /artist/authenticate ???
        {
            method: 'POST',
            path: '/artists/authenticate/validate',
            config: {
                handler: ArtistsController.authenticateValidate,
                validate: {
                    payload: artistSchema.loginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // authenticate an artist
        // TODO: what's the difference with /artist/authenticate ???
        {
            method: 'POST',
            path: '/artist/authenticate/validate',
            config: {
                handler: ArtistsController.authenticateValidate,
                validate: {
                    payload: artistSchema.loginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Authenticate an artist using Facebook
        {
            method: 'POST',
            path: '/artists/facebook_authenticate',
            config: {
                handler: ArtistsController.facebook_authenticate,
                validate: {
                    payload: artistSchema.facebookLoginSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        // Get favourite artists of an artist
        {
            method: 'GET',
            path: '/artists/{id}/favorite-artists',
            config: {
                pre: ArtistsFavoritesController.setArtist.concat(preSearchQuery),
                handler: ArtistsFavoritesController.favoriteArtists
            }
        },
        // Get artists active in current contest
        {
            method: 'GET',
            path: '/artists/{id}/active-in-current-contest',
            config: {
                handler: ArtistsController.activeInCurrentContest
            }
        },
        // Notify a missed vote
        {
            method: 'POST',
            path: '/artists/{id}/notify-missed-vote',
            config: {
                handler: ArtistsController.notifyMissedVote
            }
        },
        // Add facebook pages to an artist profile
        {
            method: 'PUT',
            path: '/artists/{slug}/add-facebook-pages',
            config: {
                handler: ArtistsController.addFacebookPages
            }
        },
        // Get artists based on facebook page ID
        {
            method: 'GET',
            path: '/artists/get-artist-from-facebook-page-id/{facebookPageId}',
            config: {
                handler: ArtistsController.getArtistFromFacebookPageId
            }
        },
        // Get artists of which an artist is fan
        {
            method: 'GET',
            path: '/artists/{slug}/fan-of-artist',
            config: {
                handler: ArtistsController.getFanOfArtist
            }
        },
        // Verify if an artist is participating in current CFE
        {
            method: 'GET',
            path: '/artists/{artistId}/participating-in-current-cfe',
            config: {
                handler: ArtistsController.participatingInCurrentCfe
            }
        },
        // Set contest media
        {
            method: 'PUT',
            path: '/artists/{id}/contest-media',
            config: {
                handler: ArtistsController.setContestMedia,
                validate: {
                    payload: artistSchema.setContestMedia,
                    failAction: PrettyHapiErrors
                }
            }
        },

        // Set preferred media
        {
            method: 'PUT',
            path: '/artists/{id}/preferred-media',
            config: {
                handler: ArtistsController.setPreferredMedia,
                validate: {
                    payload: artistSchema.setPreferredMedia,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @name Routes:Artists.Get-Artist-Lists
        *   @description <p>path: /artists/list </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> Summary: Gets all artist lists</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> fanID: req.params.id</li>
        *   </ul>
        *   @fires ArtistsController.getArtists
        *   @returns Artists list object objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/artists/list',
            config: {
                handler: ArtistsController.getArtists
            }
        },
    ]);
};
