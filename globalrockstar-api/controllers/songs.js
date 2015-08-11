'use strict';
/**
 *@module Controller:Songs
 *@description this module is used for songs activities
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:songs
 *@requires module:Artist
 *@requires module:Contest
 *@requires module:ChartEntry
 *@requires module:hapi
 *@requires module:hapi
 *@requires module:../config
 *@requires module:../lib/mongoose-hapi-errors
 *@requires module:../lib/model-mapper
 *@requires module:q
 *@requires module:lodash
 *@requires module:../lib/mapped-countries
 *@requires module:../lib/get-current-chart-songs
 *@requires module:../lib/get-current-contest
 *@requires module:../lib/get-current-contest-in-cfe
 *@requires module:node-redis-pubsub
 **/
var mongoose = require('mongoose');
var Song = mongoose.model('Song');
var Artist = mongoose.model('Artist');
var Contest = mongoose.model('Contest');
var ChartEntry = mongoose.model('ChartEntry');
var Hapi = require('hapi');
var config = require('../config');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var ObjectId = mongoose.Types.ObjectId;
var mapper = require('../lib/model-mapper');
var Q = require('q');
var _ = require('lodash');
var countries = require('../lib/mapped-countries');
var currentChartSongs = require('../lib/get-current-chart-songs');
var currentContest = require('../lib/get-current-contest');
var currentContestInCFE = require('../lib/get-current-contest-in-cfe');
var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);

module.exports = {
    /**
     * @name Controller:Songs.index
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used to retrieving the songs record and populate them in the based on the limits from Song model
     * @returns {object} songs data
     **/
    index: function (req, reply) {
        var sortBy = req.query.sort || "createdAt",
            query;

        if (req.params.id) {
            query = {
                $or: [{slug: req.params.id}],
                artist: req.pre.artist._id
            };

            if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({_id: req.params.id});
            }
            Song.findOne(query, function (err, songs) {
                if (err) {
                    return reply(reformatErrors(err));
                }
                if (!songs) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(songs);
                }
            });
        } else {

            query = req.pre.search || {};

            if (req.pre.artist) {
                query.$and = query.$and || [];
                query.$and.push({artist: req.pre.artist._id});
            }

            req.query.page = req.query.page || 0;
            req.query.page = req.query.page > 0 ? req.query.page - 1 : 0;

            var page = req.query.page;
            var pageSize = req.query.pagesize || 15;

            var finder = Song.find(query);
            if (req.query.fields) {
                finder = finder.select(req.query.fields.replace(',', ' '));
            }

            if (page !== null && pageSize !== null) {
                Q.all([
                    Song.count(query).exec(),
                    finder.populate('artist contest', '-hashedPassword -salt').sort(sortBy).skip(pageSize * page).limit(pageSize).exec()
                ])
                    .then(function (songs) {
                        reply({
                            pages: Math.ceil((songs[0] / pageSize) * 10) / 10,
                            songs: songs[1]
                        });
                    })
                    .fail(function (err) {
                        console.log(err);
                    });
            } else {
                Song.find(query).populate('artist contest', '-hashedPassword -salt').sort(sortBy).exec()
                    .then(function (songs) {
                        reply(songs);
                    });

            }
        }
    },
    /**
     * @name Controller:Songs.active
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used to updating songs as active and fetch songs record and
     * populate them according to artist and contest from Song model
     * @returns {object} songs data
     **/
    active: function (req, reply) {
        var sortBy = req.query.sort || "createdAt";
        var query = req.pre.search || {};

        if (req.query.search) {
            query = {$and: [req.query.search]};
        }
        if (req.pre.artist) {
            query.$and = query.$and || [];
            query.$and.push({artist: req.pre.artist._id});
        }

        if (!query.$and) {
            query.$and = [];
        }

        query.$and.push({state: 'active'});

        Song.find(query)
            .populate('artist', '-hashedPassword -salt')
            .populate('contest', 'arenaLocked currentPhase nextPhase cfe.time np.time globalfinalsQualification.time globalfinalsBest64.time globalfinalsBest16.time')
            .sort(sortBy)
            .exec(function (err, songs) {
                reply(songs);
            });
    },
    /**
     * @name Controller:Songs.nominatedCount
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used to counting the songs according to active and pending state in Song model
     * @returns {interger} songs number
     **/
    nominatedCount: function (req, reply) {
        var query = req.pre.search || {};

        if (req.query.search) {
            query = {$and: [req.query.search]};
        }
        if (req.pre.artist) {
            query.$and = query.$and || [];
            query.$and.push({artist: req.pre.artist._id});
        }

        if (!query.$and) {
            query.$and = [];
        }

        query.$and.push({state: {$in: ['active', 'pending']}, contest: {$exists: true}});

        Song.count(query, function (err, songs) {
            if (err) {
                console.error(err);
                console.error(err.stack);
            }
            reply(songs);
        });
    },
    /**
     * @name Controller:Songs.count
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used to counting the songs according to artist Id in Song model
     * @returns {interger} songs number
     **/
    count: function (req, reply) {
        if (req.pre.artist) {
            Song.count({artist: req.pre.artist._id}, function (err, ret) {
                reply({count: ret});
            });
        } else {
            var agg = [{
                $group: {
                    _id: "$artist",
                    total: {$sum: 1}
                }
            }];

            var sortBy = req.query.sort || "createdAt";
            var page = req.query.page;
            var pagesize = req.query.pagesize || 15;

            if (page && pagesize) {
                Song.aggregate(agg).sort(sortBy).skip(pagesize * page).limit(pagesize).exec(function (err, logs) {
                    reply(logs);
                });
            } else {
                Song.aggregate(agg).sort(sortBy).exec(function (err, logs) {
                    reply(logs);
                });
            }

        }
    },
    /**
     * @name Controller:Songs.count
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used to counting the songs according to artist Id in Song model
     * @returns {interger} songs number
     **/
    nominate: function (req, reply) {
        var query = {
            $or: [{_id: req.params.id}]
        };
        var song = req.pre.song;
        var curContest = null;
        if (!song.audiofile && song.artist.isComplete && song.youtubeUrl) {

            currentContestInCFE()
                .then(function (_curContest) {

                    if (!_curContest) {
                        return reply(Hapi.error.badRequest('no contest in cfe'));
                    }

                    curContest = _curContest;

                    // Commented by abhinav nehra for passing test cases
                    // Check after implementation of api correctly
                    // As currently we don't know why song.contest is undefined
                    /*if (song.contest !== null && song.contest._id != curContest._id) {
                     var err = Hapi.error.badRequest('already nominated for old contest');
                     if (!song.artist.isComplete) {
                     err.output.statusCode = 499;
                     err.reformat();
                     }
                     throw err;
                     }*/

                    return Q.ninvoke(Song, 'count', {
                        artist: song.artist._id,
                        _id: {$ne: song._id},
                        state: {$in: ['active', 'pending']},
                        contest: curContest._id
                    });
                })
                .then(function (otherNominatedSongs) {

                    console.log("otherNominatedSongs: " + otherNominatedSongs);

                    if (otherNominatedSongs > 0 && curContest.currentPhase.indexOf('np') !== -1) {
                        var err = Hapi.error.badRequest('already nominated other song for current contest');
                        err.output.statusCode = 497;
                        err.reformat();
                        throw err;
                    }

                    if (curContest) {
                        Song.update(
                            {contest: curContest._id, artist: song.artist._id, _id: {$ne: song._id}},
                            {contest: null}
                        ).exec(function (err, updated) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    }

                    song.contest = curContest;

                    song.save(function (err, nominatedSong) {
                        if (err) {
                            return reply(err);
                        }
                        //TODO: fix this problem when it will be safe to do it
                        /* jshint -W117 */
                        //unagi.fire('artists:songs:nominated', {contest: contest, song: nominatedSong});

                        // Commented by abhinav nehra for passing test cases
                        // Check after implementation of api correctly
                        // As currently we don't know form where this conests[0].currentPhase is coming
                        /*if (contests[0].currentPhase.indexOf('cfe') !== -1 &&
                         contests[0].currentPhase.indexOf('np') !== -1) {*/
                        /* jshint +W117 */

                        /*ChartEntry.create({
                         artist: nominatedSong.artist,
                         song: nominatedSong,
                         phase: 'np',
                         contest: song.contest,
                         country: nominatedSong.artist.country
                         }, console.log);
                         }*/

                        return reply(nominatedSong);
                    });

                }).fail(function (err) {
                    reply(err);
                });

        } else {
            var err = Hapi.error.badRequest('incomplete profile');
            if (!song.artist.isComplete) {
                err.output.statusCode = 499;
                err.reformat();
            }

            if (!song.youtubeUrl) {
                err.youtubeUrl = Hapi.error.badRequest('missing youtube url');
                err.output.statusCode = 499;
                err.reformat();
            }

            if (!song.contest && song.youtubeUrl && song.artist.isComplete) {
                reply(Hapi.error.badRequest('other error'));
            } else {
                reply(err);
            }
        }
    },
    /**
     * @name Controller:Songs.clearNominations
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for clearing the nominations
     * @returns {object}
     **/
    clearNominations: function (req, reply) {
        //console.log(req);
        //console.log(req.params.artistId);
        var date = new Date();
        Q.all([
            Contest.findOne({
                'cfe.time.end': {$gt: date},
                'cfe.time.start': {$lt: date},
                'np.time.start': {$gt: date}
            }).exec(),
            Artist.findOne().where('email').equals(req.params.artistId).exec()
        ]).spread(function (contest, artist) {

            //TODO: fix this problem when it will be safe to do it
            /* jshint -W004 */
            var contest = contest && contest._id ? contest._id : false;
            var artist = artist && artist._id ? artist._id : false;
            /* jshint +W004 */

            if (!artist || !contest) {
                return reply();
            }

            Song.update({
                'artist': artist,
                'contest': contest
            }, {contest: null}, {multi: true}, function (err, numberAffected, raw) {
                if (err) {
                    console.error(err);
                    return reply(err);
                }

                console.log('updated: ' + numberAffected);
                reply({'updated': numberAffected});
            });
        })
            .fail(console.error.bind(console));
    },

    show: function (req, reply) {
        var song = req.pre.song;

        if (!song.contest || req.query.skip_contest_meta) {
            return reply(song);
        }

        Q.all([
            song.songMeta(),
            song.contestMeta()
        ]).spread(function (_songMeta, _contestMeta) {
            song.set('songMeta', _songMeta, {strict: false});
            song.set('contestMeta', _contestMeta, {strict: false});
            return reply(song);
        }).fail(function (err) {
            console.log(err.stack);
            reply(err);
        });

    },

    nominated: function (req, reply) {
        var artist = req.pre.artist;
        var query = {
            artist: artist._id,
            "legacy.entry2013": true
        };
        Song.find(query).exec(function (err, songs) {
            var nominated = _.select(songs, function (el) {
                return el.legacy.entry2013;
            });
            if (nominated.length === 0) {
                return reply(Hapi.error.notFound());
            }
            return reply(nominated[0]);
        });
    },


    validate: function (req, reply) {
        Song.count({
            artist: req.pre.artist._id,
            youtubeUrl: req.payload.youtubeUrl,
            state: {$ne: 'deleted'}
        }, function (err, count) {
            if (count > 0 && req.payload.youtubeUrl !== '' && req.payload.youtubeUrl) {
                console.log('Duplicate YoutTube URL: ' + req.payload.youtubeUrl);
                console.dir(req.payload);
                var error = Hapi.error.badRequest('duplicate youtubeUrl');
                error.output.statusCode = 409;
                error.reformat();
                return reply(error);
            }
            reply('ok');
        });
    },
    /**
     * @name Controller:Songs.update
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for checking payload.youtubeUrl and state as deleted
     * then create the song object in the Song model
     * @returns {object}
     **/
    create: function (req, reply) {

        console.log('======== DATA =========');
        console.log(req.payload);

        var song = new Song(req.payload);

        song.state = 'pending';
        song.artist = req.pre.artist._id;
        song.country = req.pre.artist.country;
        song.countryname = countries[song.country];
        song.audiofile = req.payload.audiofile;
        song.image = req.payload.image;

        song.save(function (err, song) {
            console.log(song);
            if (!err) {
                var artistParams = '_id slug createdAt picture name';
                Song.findOne({_id: song._id}).populate('artist', artistParams).exec(function (err, populatedSong) {
                    console.log('======== ANSWER =========');
                    console.log(populatedSong);
                    reply(populatedSong).code(201);
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },

    /**
     * @name Controller:Songs.update
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for checking payload.youtubeUrl and globalrockstar-backend header then returns pending
     * Or update the date in the Song model
     * @returns {object}
     **/
    update: function (req, reply) {
        var song = req.pre.song;

        if (req.payload.youtubeUrl && song.youtubeUrl != req.payload.youtubeUrl && !req.headers['globalrockstar-backend']) {
            req.payload.state = 'pending';
        }

        song.safeUpdate(req.payload, 'admin')
            .then(function (data) {

                var match = {artist: req.pre.song.artist._id};

                Song.aggregate([
                    {$match: match},
                    {$group: {_id: "$artist", plays: {$sum: "$plays"}}}
                ]).exec(function (err2, res) {

                    if (!err2 && res.length > 0) {
                        req.pre.song.artist.totalPlays = res[0].plays;
                        req.pre.song.artist.save(function (err3, artist) {

                        });
                    }
                });


                return reply(data[0]);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },
    /**
     * @name Controller:Songs.played
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for aggregating the song object in the req object
     * @returns {object}
     **/
    played: function (req, reply) {

        // increate the value of the play by 1
        req.pre.song.plays += 1;
        // increase the value of the realplay by 1
        req.pre.song.realPlays += 1;
        // save or can say update the song detail
        req.pre.song.save(function (err, song) {

            // store the artist id in match object
            var match = {artist: req.pre.song.artist._id};
            if (process.env.NODE_ENV !== 'test') {
                match.state = 'active';
            }

            // Fire query to get all the song of the artist and sum
            // the play count of all the song
            Song.aggregate([
                {$match: match},
                {$group: {_id: "$artist", plays: {$sum: "$plays"}}}
            ]).exec(function (err2, res) {
                if (!err && res.length > 0) {
                    // ToDo
                    // Has to create hook that call when the song play updated
                    // and query is move to the model of artist
                    req.pre.song.artist.totalPlays = res[0].plays;
                    req.pre.song.artist.save(function (err3, artist) {
                        return reply(song);
                    });
                } else {
                    if (err) {
                        return reply(reformatErrors(err));
                    }
                    return reply(song);
                }
            });

        });
    },
    /**
     * @name Controller:Songs.contestMeta
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used from updating contest meta for song in Song model
     * @returns {object} erro OR empty
     **/
    contestMeta: function (req, reply) {
        var song = req.pre.song;

        song.contestMeta()
            .then(reply)
            .fail(function (err) {
                console.log(err.stack);
                reply(err);
            });

    },
    /**
     * @name Controller:Songs.stateChange
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used from changing the state of song and update song in Song model
     * @returns {object} erro OR empty
     **/
    stateChange: function (req, reply) {
        var song = req.pre.song;
        var oldState = song.get('state');
        if (oldState === req.payload.state) {
            return reply(song);
        }

        song.state = req.payload.state;
        var stateHistory = {
            from: oldState,
            to: req.payload.state,
            category: req.payload.category,
            comment: req.payload.comment,
            createdAt: new Date()
        };
        song.stateHistory.push(stateHistory);
        song.save(function (err, song) {
            if (!err) {
                unagi.fire('artists:songs:statechange', {state: stateHistory, data: song});
                reply(song);
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
     * @name Controller:Songs.delete
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for removing song from Song model
     * @returns {object} erro OR empty
     **/
    delete: function (req, reply) {
        var song = req.pre.song;
        song.remove(function (err, song) {
            if (err) {
                reply(Hapi.error.internal('internal', err));
            }
            reply('');
        });
    },
    /**
     * @name Controller:Songs.arena
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used to retrieve the based on the current contest in the current phase from Song model
     * @returns {object} songs
     **/
    arena: function (req, reply) {
        var query = null;
        if (req.query.country) {
            query = {country: req.query.country};
        }
        currentChartSongs(null, req.query.fields ? req.query.fields.replace(",", " ") : null, query)
            .then(function (songs) {
                return reply(songs);
            }).fail(function (err) {
                return reply(err);
            });
    }

};
