'use strict';

/**
 * @module Controller:Artist-Detail
 *
 * @description Provides detailed information about an artist
 *
 * @requires module:mongoose
 * @requires module:hapi
 * @requires module:lodash
 * @requires module:../config
 * @requires module:q
 */
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var ChartEntry = mongoose.model('ChartEntry');
var Song = mongoose.model('Song');
var currentContest = require('../lib/get-current-contest');
var Contest = mongoose.model('Contest');
var Payment = mongoose.model('Payment');
var Hapi = require('hapi');
var _ = require('lodash');
var config = require('../config');
var Q = require('q');
var Video = mongoose.model('Video');
//var ObjectId = mongoose.Types.ObjectId;

// Get total plays of an artist
// need to be discuss as we have the total play count in the artist schema also
var artistTotalPlays = function (artistId) {
    var payload = [
        {
            $match: {
                artist: artistId
            }
        }, {
            $group: {
                _id: '$artist',
                totalPlays: {$sum: '$plays'}
            }
        }
    ];

    var dfd = Q.defer();
    Q.ninvoke(Song, 'aggregate', payload)
        .then(function (songs) {
            dfd.resolve(songs[0] ? songs[0].totalPlays : 0);
        }).fail(function (err) {
            dfd.reject(err);
        });

    return dfd.promise;
};

// Get detailed metadata fo an artist
var artistProjectMeta = function (artistId) {

    var payload = [
        {
            $match: {
                'target.artist': artistId,
                'target.type': 'Project',
                'state': 'completed'
            }
        }, {
            $group: {
                _id: '$target.project',
                amount: {$sum: '$dollarAmount'}
            }
        }
    ];

    console.log(payload[0].$match);

    var dfd = Q.defer();
    Q.ninvoke(Payment, 'aggregate', payload)
        .then(function (res) {

            Payment.populate(res, [{
                path: '_id',
                select: '_id title slug state currency',
                model: 'Project'
            }], function (err, res) {
                dfd.resolve(res.map(function (project) {
                    project.title = project._id.title;
                    project.state = project._id.state;
                    project.currency = 'USD'; // $ only UI: project._id.currency ;
                    project.slug = project._id.slug;
                    delete project._id;
                    return project;
                }));
            });

        }).fail(dfd.reject);
    return dfd.promise;

};

// Get metadata about an artist
var artistContestMeta = function (artistId) {

    console.log(artistId);
    var payload = [
        {
            $match: {
                // status: 'processed',
                // type: { $ne: 'dummy' },
                artist: artistId
            }
        },
        {
            $sort: {
                phase: -1
            }

        },
        {
            $group: {
                _id: '$contest',
                votes: {$last: '$votes'},

                np: {$sum: {$cond: [{$eq: ['$phase', 'np']}, '$votes', 0]}},
                globalfinalsQualification: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsQualification']}, '$votes', 0]}},
                globalfinalsBest64: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsBest64']}, '$votes', 0]}},
                globalfinalsBest16: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsBest16']}, '$votes', 0]}},

                posNp: {$sum: {$cond: [{$eq: ['$phase', 'np']}, '$pos', 0]}},
                posGlobalfinalsQualification: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsQualification']}, '$pos', 0]}},
                posGlobalfinalsBest64: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsBest64']}, '$pos', 0]}},
                posGlobalfinalsBest16: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsBest16']}, '$pos', 0]}},

                nPosNp: {$sum: {$cond: [{$eq: ['$phase', 'np']}, '$nPos', 0]}},
                nPosGlobalfinalsQualification: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsQualification']}, '$nPos', 0]}},
                nPosGlobalfinalsBest64: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsBest64']}, '$nPos', 0]}},
                nPosGlobalfinalsBest16: {$sum: {$cond: [{$eq: ['$phase', 'globalfinalsBest16']}, '$nPos', 0]}},

                voteTypesNp: {$push: {$cond: [{$eq: ['$phase', 'np']}, '$voteTypes', null]}},
                voteTypesGlobalfinalsQualification: {$push: {$cond: [{$eq: ['$phase', 'globalfinalsQualification']}, '$voteTypes', null]}},
                voteTypesGlobalfinalsBest64: {$push: {$cond: [{$eq: ['$phase', 'globalfinalsBest64']}, '$voteTypes', null]}},
                voteTypesGlobalfinalsBest16: {$push: {$cond: [{$eq: ['$phase', 'globalfinalsBest16']}, '$voteTypes', null]}},

                phases: {$push: '$phase'},
                lastPhase: {$last: '$phase'},
                song: {$first: '$song'},
                pos: {$last: '$pos'},
                nPos: {$first: '$nPos'},
                voteTypes: {$last: '$voteTypes'},
                credits_dollar: {$sum: {$multiply: ['$voteTypes.purchase', config.payment.paidVotePrice.USD.artist]}},
                credits_euro: {$sum: {$multiply: ['$voteTypes.purchase', config.payment.paidVotePrice.USD.artist]}}
            }
        },
        {
            $project: {
                _id: 1,
                votes: 1,
                pos: 1,
                nPos: 1,
                song: 1,
                credits_dollar: 1,
                credits_euro: 1,
                lastPhase: 1,
                phases: 1,
                voteTypes: 1,
                phasesMeta: {
                    np: {
                        votes: '$np',
                        pos: '$posNp',
                        nPos: '$nPosNp',
                        voteTypes: '$voteTypesNp'
                    },
                    globalfinalsQualification: {
                        votes: '$globalfinalsQualification',
                        pos: '$posGlobalfinalsQualification',
                        nPos: '$nPosGlobalfinalsQualification',
                        voteTypes: '$voteTypesGlobalfinalsQualification'
                    },
                    globalfinalsBest64: {
                        votes: '$globalfinalsBest64',
                        pos: '$posGlobalfinalsBest64',
                        nPos: '$nPosGlobalfinalsBest64',
                        voteTypes: '$voteTypesGlobalfinalsBest64'
                    },
                    globalfinalsBest16: {
                        votes: '$globalfinalsBest16',
                        pos: '$posGlobalfinalsBest16',
                        nPos: '$nPosGlobalfinalsBest16',
                        voteTypes: '$voteTypesGlobalfinalsBest16'
                    }
                }
            }
        }
    ];

    var dfd = Q.defer();

    var elaboratePhasesMeta = function (phasesMeta) {
        _.map(phasesMeta, function (val, key) {
            val.voteTypes = _.compact(val.voteTypes)[0] || 0;
            if (val.voteTypes && val.voteTypes.purchase) {
                if (val.voteTypes.serie) {
                    val.voteTypes.purchase -= val.voteTypes.serie;
                }
                //val.credits_dollar  = ( val.voteTypes.purchase - val.voteTypes.serie ) * config.payment.paidVotePrice.USD.artist ;

                val.credits_dollar = val.credits_euro = val.voteTypes.purchase * config.payment.paidVotePrice.USD.artist;
            } else {
                val.credits_dollar = val.credits_euro = 0.0;
            }
            val.name = key;
            return val;
        });
    };

    var deleteExtraProperties = function (entry) {
        delete entry._id;
        delete entry.globalfinalsQualification;
        delete entry.globalfinalsBest64;
        delete entry.globalfinalsBest16;
        delete entry.np;
        return entry;
    };

    Q.ninvoke(ChartEntry, 'aggregate', payload)
        .then(function (chartEntries) {
            console.log(chartEntries.length);
            Contest.populate(chartEntries, [
                {path: '_id', select: 'name createdAt', model: 'Contest'},
                {path: 'song', select: 'plays', model: 'Song'}
            ], function (err, res) {

                var result = res.map(function (entry) {
                    // entry.votes = entry[entry.lastPhase];
                    entry.plays = entry.song.plays;
                    entry.name = entry._id.name;
                    entry.createdAt = entry._id.createdAt;
                    entry.id = entry._id._id;

                    entry.pos = entry.phasesMeta[entry.lastPhase] ? entry.phasesMeta[entry.lastPhase].pos : 0;
                    entry.nPos = entry.phasesMeta[entry.lastPhase] ? entry.phasesMeta[entry.lastPhase].nPos : 0;

                    if (entry.voteTypes && entry.voteTypes.purchase) {
                        if (entry.voteTypes.serie) {
                            entry.voteTypes.purchase -= entry.voteTypes.serie;
                        }
                        // entry.credits_dollar = entry.credits_euro = entry.voteTypes.purchase * config.payment.paidVotePrice.USD.artist ;
                    }

                    entry.phasesMeta = elaboratePhasesMeta(entry.phasesMeta);

                    entry.credits_dollar = entry.credits_euro = entry.phasesMeta[0].credits_dollar || 0;

                    var gfPhases = entry.phasesMeta.slice(1).filter(function (el) {
                        return el.credits_dollar > 0;
                    });
                    if (gfPhases.length) {
                        entry.credits_dollar = entry.credits_euro += gfPhases.slice(-1)[0].credits_dollar;
                    }

                    return deleteExtraProperties(entry);
                });

                dfd.resolve(result);
            });
        })
        .fail(function (err) {
            dfd.reject(err);
        });

    return dfd.promise;

};

// Get selected song based on req.params.songId or get one of the artist song
var getSelectedSong = function (req) {
    var artist = req.pre.artist;
    // ToDo
    // Need to change when we have priority key is set
    // MeetingDiscussion - Have to check the which song is set as artist profile song
    // This has to be change after 2015 contest
    return Q.ninvoke(Contest.findOne({
            'cfe.time.start': {$lte: (new Date()).toISOString()},
            'finals.time.end': {$gte: (new Date()).toISOString()}
        }), 'exec').then(function (contest) {

            var songQuery = {};
            var contest_Id ;
            if (!contest) {
                contest_Id = null;
            }else {
                contest_Id = contest._id;
            }
            if (!req.params.songId) {
                // TODO Has to change after 2015 contest as there may be more than one contest after 2015
                // If there is no running contest then we simple return null
                // and if there is some running contest then we return the request
                // for the song api
                songQuery.state = 'active';
                songQuery.artist = artist.id;
                if (contest_Id !== null) {
                    songQuery.contest = contest_Id;
                }else {
                    return null;
                }
            } else {
                songQuery = {state: 'active', artist: artist.id, $or: [{slug: req.params.songId}]};
                if (req.params.songId.match(/^[0-9a-fA-F]{24}$/)) {
                    songQuery.$or.push({_id: req.params.songId});
                }
            }
            return Q.ninvoke(Song, 'findOne', songQuery);
        });
};

var getPreferredMedia = function (artist) {
    var model;
    if (artist.preferredMediaType) {
        if (artist.preferredMediaType == 'video') {
            model = Video;
        }else if (artist.preferredMediaType == 'song') {
            model = Song;
        }
        return Q.ninvoke(model, 'findOne', {'_id' : artist.preferredMedia});
    }else {
        return null;
    }
}

module.exports = {

    /**
     * Find an artist given the req.params.id or req.params.slug
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    findArtist: function (req, reply) {
        // req.params.id assigned to slug
        // in this we put the or condition to check using slug
        // this handle both type of request means
        // can search the user using slug or by id
        var query = {$or: [{slug: req.params.id}]};

        // Check if the id is a mongodb hash and add it to the query
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }

        // Prepare the populate query function (it will populate the artist result with fans)
        // create the mongo quety to find the artist along with its fan
        var findArtist = Artist.findOne(query, '-hashedPassword -currentLoginTimestamp -salt -stateHistory -verificationToken')
            .populate([
                // get the fan detai by using the fan collection
                {
                    path: 'fans',
                    select: 'firstname lastname slug picture _id state',
                    //match: {state: {$in: ['active', 'pending']}},
                    model: 'Fan'
                },
                // get the detail of fan that are artist too by using the artsit collection
                {
                    path: 'fans_a',
                    select: 'name slug picture id state',
                    //  match: {state: {$in: ['active', 'pending']}},
                    model: 'Artist'
                }
            ]);

        // Invoke the findArtist function managing the deferred result
        Q.ninvoke(findArtist, 'exec')
            .then(function (artist) {
                if (!artist) {
                    return reply(Hapi.error.notFound());
                }
                reply(artist);
            }).fail(function (err) {
                reply(err);
            });
    },

    /**
     * Get detailed stats about an artists or an artist's song
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    detailStats: function (req, reply) {
        var selectedSong = null;
        var artist = req.pre.artist;
        var contest = null;

        Q.all([
            getSelectedSong(req),
            currentContest()
        ])
            .spread(function (_selectedSong, _contest) {
                selectedSong = _selectedSong;
                contest = _contest;

                var e = [artistContestMeta(artist._id)];
                e.push(artistTotalPlays(artist._id));
                e.push(artistProjectMeta(artist._id));
                if (selectedSong) {
                    e.push(selectedSong.songMeta());
                    e.push(selectedSong.contestMeta());
                }

                return Q.all(e);

            }).spread(function (_artistContestMeta, _totalPlays, _projectMeta, _songContestMeta) {
                //console.log(_projectMeta);
                var result = {
                    _id: req.params.id,
                    totalPlays: _totalPlays,
                    contestMeta: _artistContestMeta,
                    projectMeta: _projectMeta
                };

                if (selectedSong) {
                    result.selectedSong = {_id: selectedSong._id, songMeta: _songContestMeta};
                }

                //console.log('DETAIL STATS =>');
                //console.log(JSON.stringify(result, null, 2));

                reply(result);

            }).fail(function (err) {
                reply(err);
                console.log(err.stack);
            });
    },

    /**
    *   @desc Get all the detail related to the artist along with the its song and
    *   selected song which is shown on its profile top
    *   @function
    *   @name Controller:Artist-Detail.detail
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    detail: function (req, reply) {
        var artist = req.pre.artist;
        var contest = null;
        // ToDO
        // Get current contest
        // have to add one more condition in this query which is
        // to check the higher priority contest
        // AfterMeeting discussion - Most probably it should be removed in future after the artist profile song is filnize
        Q.ninvoke(Contest.findOne({
            'cfe.time.start': {$lte: (new Date()).toISOString()},
            'finals.time.end': {$gte: (new Date()).toISOString()}
        }).sort({'cfe.time.start': -1}), 'exec').then(function (_contest) {
                contest = _contest;
                // making the query to find all the song of the artist and that are active
                // and sort them according to the contest and created date
                var songFinder = Song.find({artist: artist._id, state: 'active'}).sort('-contest order -createdAt');
                return Q.all([
                    // Request to search all the song related to artist
                    Q.ninvoke(songFinder, 'exec'),
                    // function to get the selected song of the artist
                    getSelectedSong(req),
                    // callling function to get the total play of the artist
                    // need to be discuss as we have the total play count in artist schema also
                    // and here we are calculating Playcount after calculating aggregate of all the song
                    // that are related to the artist
                    //artistTotalPlays(artist._id)
                    getPreferredMedia(artist)
                ]);
            })
            .spread(function (songs, selectedSong, preferredMedia) {
                artist = artist.toObject();
                // use lodash for sorting the songs
                artist.songs = _.sortBy(songs, function (song) {
                    var idx = songs.indexOf(song);
                    //current contest song should be in first position | needed by mobiles
                    if (contest && song.contest && song.contest.toString() === contest._id.toString()) {
                        idx = -10;
                        return idx;
                    }else {
                        return idx;
                    }
                });
                // As we are getting the totalPlays key in the artist detail So it is useless to calculate
                // it again
                //artist.totalPlays = totalPlays;
                // ToDo
                // This is change in the future sprint
                // selected song is selected form the diffrent key of song schema
                if (selectedSong) {
                    artist.selectedSong = selectedSong.toObject();
                } else {
                    if (preferredMedia) {
                        artist.selectedSong = preferredMedia;
                    }else {
                        artist.selectedSong = songs[0];
                    }
                }

                // Concatenate and flat fans array
                // allFanId extract only the id of all the fan
                var allFansId = _.chain([artist.fans, artist.fans_a]).flatten().pluck('_id').value();
                // ranFanDetail get the detail of the fan and has a limit of 8
                // means detail of only 8 fan store in the this variable
                var randomFansDetail = _.chain([artist.fans, artist.fans_a])
                    .map(function (el, idx) {
                        return el.map(function (fan) {
                            return {
                                slug: fan.slug,
                                firstname: fan.firstname,
                                lastname: fan.lastname,
                                picture: fan.picture,
                                name: fan.name,
                                state: fan.state,
                                _id: fan._id,
                                type: idx === 0 ? 'fans' : 'artists'
                            };
                        });
                    })
                    .flatten()
                    //.sample(8)
                    .value();
                // artist.fan means the user that are register as a fan and
                // became a fan of the artist
                // delete the artist fan object
                //delete artist.fans;
                // artist.fan_a means the user that are register as a artist and
                // became a fan of the artist
                // delete the artist fan object
                //delete artist.fans_a;
                artist.fans = allFansId;
                artist.randomFans = randomFansDetail;

                if (!selectedSong) {
                    return 0;
                }
                // ToDo in future sprint
                // Has tobe change according to the new schema of contest
                // as discuss in the meeting
                // As we don't have globalfinalsQualification ,
                // globalfinalsBest64','globalfinalsBest16'
                // In the future contest

                var phase = contest.currentPhase.slice(-1);
                if (['finals'].indexOf(phase[0]) !== -1) {
                    phase = contest.previousPhase;
                }
                if (['pause'].indexOf(phase[0]) !== -1) {
                    phase = contest.nextPhase;
                }
                // ToDO
                // Has to be removed in the future sprint as
                // we can store the selected song  of the artist profile using the api
                // that is created in future
                return Q.ninvoke(ChartEntry, 'count', {
                    phase: phase,
                    contest: contest._id,
                    song: selectedSong._id
                });
            })
            .then(function (chartEntryCount) {
                if (artist.selectedSong) {
                    artist.selectedSong.activeInCurrentContest = chartEntryCount > 0;
                }
                reply(artist);
            })
            .fail(function (err) {
                reply(err);
                console.log(err.stack);
            });
    },
    getArtistSongs : function (req, reply) {
        var artist = req.pre.artist;
        var media = {};
        Q.all([
            Song.find({artist : artist._id})
            .populate({
                path: 'artist',
                select: 'name slug picture _id state',
                //match: {state: {$in: ['active', 'pending']}},
                model: 'Artist'
            }).exec(),
            Video.find({artist : artist._id})
            .populate({
                path: 'artist',
                select: 'name slug picture _id state',
                //match: {state: {$in: ['active', 'pending']}},
                model: 'Artist'
            }).exec()
        ]).spread(function (_songs, _videos) {
            if (_songs.length) {
                media.song = _songs;
                media.songLength = _songs.length;
            }else {
                media.songs = [];
                media.songLength = 0;
            }

            if (_videos.length) {
                media.video = _videos;
                media.videoLength = _videos.length;
            }else {
                media.video = [];
                media.videoLength = 0;
            }

            reply(media);

        })
        .fail(function (err) {
            console.log(err);
        })
    }
};
