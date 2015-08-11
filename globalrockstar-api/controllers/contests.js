'use strict';
/**
 * @module Controller:contests
 *
 * @description Provides information about contests
 *
 * @requires module:mongoose
 * @requires module:hapi
 * @requires module:q
 * @requires module:../config
 * @requires module:lodash
 * @requires module:../lib/mongoose-hapi-errors
 * @requires module:node-redis-pubsub
 * @requires module:../lib/get-current-contest
 * @requires module:../lib/get-current-chartentries
 *
 */
var mongoose = require('mongoose');
var Song = mongoose.model('Song');
var Artist = mongoose.model('Artist');
var Vote = mongoose.model('Vote');
var Contest = mongoose.model('Contest');
var ChartEntry = mongoose.model('ChartEntry');
var Payment = mongoose.model('Payment');
var Hapi = require('hapi');
var Q = require('q');
var findContest = Q.nbind(Contest.findOne, Contest);
var config = require('../config');
var _ = require('lodash');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);
var currentContest = require('../lib/get-current-contest');
var currentChartentries = require('../lib/get-current-chartentries');

var countVotes = Q.nbind(Vote.count, Vote);

function conditionallyAddArtistsToFilter(filters, search) {
    return currentContest().then(function (contest) {
        if (!search.contest) {
            return Q.resolve(contest);
        }
        if (search.contest === contest._id.toString()) {
            return Q.resolve(contest);
        }

        return Q.ninvoke(Contest, 'findById', search.contest);
    }).then(function (contest) {
        var currentPhase = contest.currentPhase[0];
        if (currentPhase === 'pause') {
            currentPhase = contest.nextPhase[0];
        }

        filters.contest = contest._id;

        if (currentPhase.indexOf('globalfinals') !== -1) {
            var dfd = Q.defer();
            currentChartentries(0, 'artist', currentPhase).then(function (entries) {
                var artistIds = entries.map(_.property('artist')).filter(function (el) {
                    return el;
                });

                filters.artist = {
                    $in: artistIds
                };

                dfd.resolve(true);
            }).fail(function (err) {
                console.log(err);
            });
            return dfd.promise;
        }
        return Q.resolve(false);
    });
}

function matchId(id) {
    return function (obj) {
        return obj._id.toString() === id.toString();
    };
}

function getPurchases(ids) {
    return Q.all([
        Q.ninvoke(Payment.aggregate()
            .match({
                'target.artist': {
                    $in: ids
                },
                'target.project': {$exists: 1},
                state: 'completed'
            })
            .project({
                'target.artist': 1,
                'dollarAmount': 1
            })
            .group({
                _id: '$target.artist',
                totalPurchases: {
                    $sum: '$dollarAmount'
                }
            }), 'exec'),
        Q.ninvoke(Vote.aggregate()
            .match({
                'artist': {
                    $in: ids
                },
                type: 'purchase',
                status: 'processed',
                series_vote: {$ne: true}
            })
            .project({
                'artist': 1
            })
            .group({
                _id: '$artist',
                totalPurchases: {
                    $sum: 1
                }
            }), 'exec')
    ]);

}


module.exports = {

    /**
     * Get information about all contests
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */

    index: function (req, reply) {
        var sortBy = req.query.sort || 'createdAt';
        var query = Contest.find(req.pre.search).sort(sortBy);
        if (req.query.fields) {
            query = query.select(req.query.fields);
        }
        query.exec()
            .then(function (contests) {
                reply(contests);
            });
    },

    /**
     * Create a new contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    create: function (req, reply) {
        var contest = new Contest(req.payload);
        contest.save(function (err, obj) {
            if (!err) {
                reply(obj);
            } else {
                reply(err);
            }
        });
    },

    /**
     * Show information about a specific contest, given the req.params.id
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    show: function (req, reply) {
        var query = {
            $or: [{
                slug: req.params.id
            }]
        };
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({
                _id: req.params.id
            });
        }
        findContest(query)
            .then(function (contest) {
                if (!contest) {
                    return reply(Hapi.error.notFound());
                }
                reply(contest);
            }).fail(function (err) {
                reply(err);
            });
    },

    /**
     * Get statistics about a specific contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    stats: function (req, reply) {

        Q.all([
            countVotes({
                contest: req.pre.contest._id,
                status: 'processed',
                type: {$in: ['facebook', 'twitter', 'purchase', 'bonus', 'fan']}
            }),
            countVotes({
                contest: req.pre.contest._id,
                status: 'processed',
                platform: 'ios',
                type: {$in: ['facebook', 'twitter', 'purchase', 'bonus', 'fan']}
            }),
            countVotes({
                contest: req.pre.contest._id,
                status: 'processed',
                platform: 'android',
                type: {$in: ['facebook', 'twitter', 'purchase', 'bonus', 'fan']}
            }),
            countVotes({
                contest: req.pre.contest._id,
                status: 'processed',
                platform: 'desktop',
                type: {$in: ['facebook', 'twitter', 'purchase', 'bonus', 'fan']}
            }),
            countVotes({
                contest: req.pre.contest._id,
                status: 'processed',
                type: 'facebook'
            }),
            countVotes({
                contest: req.pre.contest._id,
                status: 'processed',
                type: 'twitter'
            }),
            countVotes({
                contest: req.pre.contest._id,
                status: 'processed',
                type: 'purchase'
            }),
            Q.ninvoke(Song, 'count', {
                contest: req.pre.contest._id,
                state: 'active'
            })
        ]).spread(function (allVotes, iOSVotes, androidVotes, desktopVotes, facebookVotes, twitterVotes, purchaseVotes, nominees) {

            reply({
                _id: req.pre.contest._id,
                name: req.pre.contest.name,
                votes: {
                    all: allVotes,
                    type: {
                        facebook: facebookVotes,
                        twitter: twitterVotes,
                        purchase: purchaseVotes
                    },
                    platform: {
                        ios: iOSVotes,
                        android: androidVotes,
                        desktop: desktopVotes

                    }
                },
                nominees: nominees
            });
        }).fail(function (err) {
            console.log(err.stack);
            reply(err);
        });
    },

    /**
    *  @event
    *  @name Controller:contests.next
    *  @param {object} req - Request object
    *  @param {function} reply - hapi reply interface
    *  @desc Get the next contest detail
    **/
    next: function (req, reply) {
        // call the chain function next of Contest schema
        Contest.next(function (err, contest) {
            if (err) {
                return reply(err);
            }
            if (!contest) {
                return reply([]);
            }
            if (!contest.length) {
                return reply([]);
            }
            var slug;
            if (!req.params.slug) {
                slug = null;
            }else {
                slug = req.params.slug;
            }
            if (!slug) {
                return reply(contest);
            }else {
                var query = {
                    $or: [{
                        slug: slug
                    }]
                };
                if (slug.match(/^[0-9a-fA-F]{24}$/)) {
                    query.$or.push({
                        _id: slug
                    });
                }
                // Find the artist
                Q.ninvoke(Artist.findOne(query, '_id'), 'exec')
                .then(function (_artist) {
                    var artist = _artist;

                    if (!artist) {
                        return reply(Hapi.error.notFound());
                    }
                    // check if the aritst participated in the next contest or not
                    Q.ninvoke(ChartEntry.findOne({
                        $and: [
                            {artist: artist._id},
                            {contest : contest[0]._id}
                        ]}), 'exec')
                    .then(function (contestEntry) {
                        if (!contestEntry) {
                            reply({
                                contest: contest,
                                isParticipated : false
                            });
                        }else {
                            reply({contest: contest,
                            isParticipated : true});
                        }
                    });
                });
            }
        });
    },

    /**
     * Get the running contest (from cfe to globalfinalsBest16)
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    running: function (req, reply) {
        Contest.running(function (err, contest) {
            if (err) {
                return reply(err);
            }
            reply(contest);
        });
    },

    /**
     * Get the current contest (from cfe to finals end)
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    current: function (req, reply) {
        Contest.current(function (err, contest) {
            if (err) {
                return reply(err);
            }
            if (!contest) {
                return reply(Hapi.error.notFound());
            }
            reply(contest);
        });
    },

    /**
     * Get the previous contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    previous: function (req, reply) {
        Contest.previous(function (err, contest) {
            if (err) {
                return reply(err);
            }
            if (!contest) {
                return reply([]);
            }
            reply([contest]);
        });
    },

    /**
     * Update a specific contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    update: function (req, reply) {
        findContest({
            _id: req.params.id
        })
            .then(function (contest) {
                if (!contest) {
                    return reply(Hapi.error.notFound());
                }
                return contest.safeUpdate(req.payload);
            })
            .then(function (data) {
                unagi.fire('contests:updated', data[0]);
                return reply(data[0]);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },

    /**
     * Delete a specific contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    delete: function (req, reply) {
        Contest.findOne({
            _id: req.params.id
        }, function (err, contest) {
            if (!contest || err) {
                return reply(Hapi.error.notFound());
            }

            contest.remove(function (err) {
                if (err) {
                    reply(Hapi.error.internal('internal', err));
                }
                reply('');
            });

        });
    },

    /**
     * Get the contestants of a specific contest (use query string parameters to 
     * filter and select the scope)
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    contestants: function (req, reply) {
        var page = req.query.page || 0;
        var pageSize = req.query.pagesize || 20;
        var filters = req.query.search && Object.keys(req.query.search).length ? req.pre.search : {
            'state': 'active'
        };

        conditionallyAddArtistsToFilter(filters, req.query || {}).then(function () {
            if (!req.query.sort || req.query.sort === 'recommendation') {
                ['country', 'genres'].forEach(function (prop) {
                    if (req.query.search && req.query.search[prop]) {
                        filters[prop] = req.query.search[prop];
                    }
                });

                var usergenres = req.query.usergenres ? req.query.usergenres.split(',') || [req.query.usergenres] : [];

                Q.all([
                    Song.aggregate([{
                        $match: filters
                    }, {
                        $project: {
                            _id: 1,
                            slug: 1,
                            createdAt: 1,
                            artist: 1,
                            country: 1,
                            cotest: 1,
                            plays: 1,
                            youtube: 1,
                            genres: 1,
                            stars: 1,
                            matches: {
                                $add: [{
                                    $size: {
                                        $setIntersection: ['$genres', usergenres]
                                    }
                                }, {
                                    $multiply: ['$stars', 0.19]
                                }]
                            }
                        }
                    }, {
                        $sort: {
                            matches: -1,
                            createdAt: -1
                        }
                    }, {
                        $skip: pageSize * page
                    }, {
                        $limit: parseFloat(pageSize)
                    }]).exec(),
                    Song.count(filters).exec()
                ]).spread(function (_songs, _count) {
                    songs = _songs;
                    count = _count;
                    var artistIds = songs.map(_.property('artist'));

                    return Q.all([
                        Q.ninvoke(Artist.find({
                            _id: {
                                $in: artistIds
                            }
                        }).lean(true), 'exec'),
                        getPurchases(artistIds)
                    ]);
                }).spread(function (artists, allPayments) {
                    var payments = allPayments[0];
                    var votes = allPayments[1];
                    payments.forEach(function (s) {
                        artists.filter(matchId(s._id))[0].totalPurchases = s.totalPurchases;
                    });

                    votes.forEach(function (s) {
                        var artist = artists.filter(matchId(s._id))[0];
                        artist.totalPurchases = (artist.totalPurchases || 0) + s.totalPurchases * (config.payment.paidVotePrice.USD.artist);
                    });

                    songs.forEach(function (s) {
                        var artist = _.find(artists, {
                            _id: s.artist
                        });
                        s.artist = artist;
                    });

                    reply({
                        pages: Math.ceil((count / pageSize) * 10) / 10,
                        songs: songs
                    });
                }).fail(function (err) {
                    console.error(err);
                    reply(err);
                });
            } else {
                var sortBy = req.query.sort || 'createdAt';

                if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                    filters.$and = filters.$and || [];
                    filters.$and.push({
                        contest: req.params.id
                    });
                }

                var songs, count;
                Q.all([
                    Song.count(filters).exec(),
                    Song.find(filters).skip(pageSize * page).limit(pageSize).populate('artist').lean(true).sort(sortBy).exec()
                ]).spread(function (_count, _songs) {
                    count = _count;
                    songs = _songs;
                    var artistIds = songs.map(function (s) {
                        return s.artist._id;
                    });
                    return getPurchases(artistIds);
                }).spread(function (payments, votes) {
                    var artists = songs.map(function (s) {
                        return s.artist;
                    });
                    payments.forEach(function (s) {
                        artists.filter(matchId(s._id))[0].totalPurchases = s.totalPurchases;
                    });

                    votes.forEach(function (s) {
                        var artist = artists.filter(matchId(s._id))[0];
                        artist.totalPurchases = (artist.totalPurchases || 0) + s.totalPurchases * (config.payment.paidVotePrice.USD.artist);
                    });

                    reply({
                        pages: Math.ceil((count / pageSize) * 10) / 10,
                        songs: songs
                    });
                }).fail(function (err) {
                    console.error(err.stack);
                    reply(err);
                });
            }
        }).fail(function (err) {
            console.error(err.stack);
            reply(err);
        });
    },

    /**
     * Get all the phases of the current contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    phases: function (req, reply) {
        var contest = req.pre.contest;
        ChartEntry.find({
            contest: contest._id
        })
            .distinct('phase')
            .exec(function (err, res) {
                console.dir(err);
                reply(res);
            });
    },
    /**
    *   @function
    *   @name Controller:contests.currentPhase
    *   @desc Get the current phase of the contest
    *   @param req{object} - contain the detial of the request
    *   @param reply{interface}- used for response
    **/
    currentPhase: function (req, reply) {
        var contest = req.pre.contest;
        // call the  virtual function currentphase for getting the current phase
        // and if we get more than one phase then we select the last one
        // Change to give all the active phase during overlaping of the phase
        // as discuss with manuel
        var phase = contest.currentPhase;
        // reply the phase
        reply(phase);
    }
};
