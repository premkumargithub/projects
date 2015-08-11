'use strict';
/**
*   @module Controller:Artists
*   @description Provides information about an artist
*
*   @requires module:mongoose
*   @requires module:../lib/get-current-contest
*   @requires module:hapi
*   @requires module:../config
*   @requires module:../lib/mongoose-hapi-errors
*   @requires module:q
*   @requires module:../models/vote
*   @requires module:node-redis-pubsub
*   @requires module:../lib/is-true
*
*/
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var Payment = mongoose.model('Payment');
var ChartEntry = mongoose.model('ChartEntry');
var currentContest = require('../lib/get-current-contest');
var Hapi = require('hapi');
var config = require('../config');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var Q = require('q');
var Vote = require('../models/vote');
var nrp = require('node-redis-pubsub');
var Contest = mongoose.model('Contest');
var Song = mongoose.model('Song');
var Video = mongoose.model('Video');
var unagi = new nrp(config.redis);
var MissedVote = mongoose.model('MissedVote');
var findArtist = Q.nbind(Artist.findOne, Artist);
var isTrue = require('../lib/is-true');
var Project = mongoose.model('Project');

function matchId(id) {
    return function (obj) {
        return obj._id.toString() === id.toString();
    };
}

/**
*   @function
*   @name Controller:artists.getPurchases
*   @description This function is used to get the totol purchase
*   of the artist by doing sum of of the purchase
*   @param ids{integer} - unique artist id
**/
function getPurchases(ids) {
    return Q.all([
        // Calculating the total purchase of the artist
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

/**
*   @function
*   @name Controller:artists.setQuery
*   @desc This function is used  for creating the filter
*   by checking all the condition that the user set for
*   the result
**/
var setQuery = function (req) {
    var query = req.pre.search || {};

    // If user add country in the filter
    if (req.query.country) {
        if (!query.$and) {
            query.$and = [];
        }
        query.$and.push({
            country: req.query.country
        });
    }
    // if user add the genre that user like
    if (req.query.genre) {
        if (!query.$and) {
            query.$and = [];
        }
        query.$and.push({
            genres_own: req.query.genre
        });
    }
    // If user add the state for which he/she want
    // the result
    if (req.query.state) {
        if (!query.$and) {
            query.$and = [];
        }
        query.$and.push({
            state: req.query.state
        });
    }
    //If user add the isComplete filter
    if (req.query.isComplete) {
        if (!query.$and) {
            query.$and = [];
        }
        query.$and.push({
            isComplete: req.query.isComplete
        });
    }
    return query;
};

/**
*   @function
*   @name Controller:artists.getById
*   @description This function is used to find the artist
*   by the id that come in the url
**/
function getById(req, reply) {
    // Add the sorting order in which user get the result
    var sortBy = req.query.sort || '-createdAt';
    // adding the id in the query or condition
    var query = {
        $or: [{
            slug: req.params.id
        }]
    };
    // Pushing the one more condition in query
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({
            _id: req.params.id
        });
    }

    // Pushing the email to the or condition of query
    if (req.params.id.indexOf('@') > 0) {
        query.$or.push({
            'email': req.params.id
        });
    }

    // console.warn('WARNING: Artist Fans will be populated!');
    // Find the aritist using the condition store in the query
    Artist.findOne(query, '-salt -hashedPassword')
        // .populate('fans fans_a', 'slug picture firstname lastname name state')
        .sort(sortBy).exec()
        .then(function (artists) {
            if (!artists) {
                reply(Hapi.error.notFound());
            } else {
                reply(artists);
            }
        }, function (err) {
            if (err) {
                return reply(reformatErrors(err));
            }
        });

}

/**
*   @function
*   @name Controller:Artists.getParticipant
*   @description This function is used to check if the artist
*   that are followed by teh fan has taken part in the current contest
**/
function getParticipant(contest, artistIds) {
    // if there is a contest then get the artist that are participated
    // in the contest and if no contest is running return null
    if (contest) {
        return Q.ninvoke(ChartEntry.find(
            {artist : {$in : artistIds},
            contest : contest._id}), 'exec');
    }else {
        return [];
    }
}

/**
*   @function
*   @name Controller:Artists.getPorjectEarnings
*   @description Used to fetch the projects which are created by artist
*   returns projects object
**/
function getPorjectEarnings(ids) {
    return Q.ninvoke(Project.find({artist : {$in : ids}}, 
        {_id: 1, artist: 1, deleted: 1}), 'exec');
}

module.exports = {
    /**
    *   @function
    *   @name Controller:Artists.getArtists
    *   @desc This function is used to get all the artist according to query params 
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    getArtists: function (req, reply) {
        var artists = {};
        // Assigning sorting order
        var sortBy = req.query.sort || '-createdAt';
        var query, page, pageSize;

        page = req.query.page > 0 ? req.query.page - 1 : 0;
        pageSize = req.query.pagesize || 20;
        var usergenres = req.query.usergenres ? req.query.usergenres.split(',') || [req.query.usergenres] : [];
        var artists;
        var count;
        // Calling the function setQuery to get the query according
        // to the filter applied by the user
        query = setQuery(req);

        // Artist type filter all/featured
        if (req.query.search && req.query.search == 'featured') {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({
                featured: 'on'
            });
        }
        Q.all([
            Artist.aggregate([{
                $match: query
            }, {
                $project: {
                    _id: 1,
                    name: 1,
                    genres_music: 1,
                    slug: 1,
                    country: 1,
                    featured: 1,
                    picture: 1,
                    fans: 1,
                    fans_a: 1,
                    credits: 1,
                    totalPlays: 1,
                    createdAt: 1,
                    fanCount: 1,
                    matches: {
                        $add: [{
                            $cond: [{
                                $or: [{
                                    $eq: ['$featured', true]
                                }, {
                                    $eq: ['$featured', 'on']
                                }]
                            },
                                3, 0
                            ]
                        }, {
                            $size: {
                                $setIntersection: ['$genres_music', usergenres]
                            }
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
            Artist.count(query).exec(),
            Q.ninvoke(Contest.findOne({
                // Condition for getting the record whose end date is greater than current date
                'cfe.time.start': {$lte: (new Date()).toISOString()},
                'finals.time.end': {$gte: (new Date()).toISOString()}
            }, {
                _id : 1,
                name : 1,
                'finals.time' : 1
            }), 'exec')
        ]).spread(function (_artists, _count, _contest) {
            count = _count;
            artists = _artists;
            var ids = artists.map(function (artist) {
                return artist._id;
            });
            return Q.all([
                Q.ninvoke(Song.find(
                    {artist: {$in : ids},
                     state: 'active'}), 'exec'),
                getParticipant(_contest, ids),
                getPorjectEarnings(ids),
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
                        },
                        totalSupport : {
                            $sum: 1
                        }
                    }), 'exec'),
                // Find the total votes received by the artist's
                // which are followed by the fan
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
                        'artist': 1,
                    })
                    .group({
                        _id: '$artist',
                        totalPurchases: {
                            $sum: 1
                        },
                        totalVotes : {
                            $sum : 1
                        }
                    }), 'exec')
            ]);
        }).spread(function (_songs, artistParticipate, _earnings, _payments, _votes) {
            // iterate the artist
            //console.log(_earnings);
            //Prepare project
            // var projects = [];
            // _earnings.forEach(function(item) {
            //     projects[item.artist] = item;
            // });
            // console.log(projects);
            artists.forEach(function (artist) {
                if (_earnings &&
                    _earnings.artist &&
                    _earnings.artist == artist._id ) {
                    artist.isProject = 1;
                    artist.earnings = {
                        projects: _earnings
                    };
                }else {
                    artist.isProject = 0;
                    artist.earnings = {
                        projects: []
                    };
                }
                artist.isSong = 0;
                artist.isParticipant = 0;
                artist.totalPurchases = 0;
            });
            // iterate all the artist that participated in the contest
            artistParticipate.forEach(function (record) {
                artists.filter(matchId(record.artist))[0].isParticipant = 1;
            });
            // iterate songs to match the artist
            _songs.forEach(function (song) {
                artists.filter(matchId(song.artist))[0].isSong = 1;
            });
            // payments.forEach(function (s) {
            //     artists.filter(matchId(s._id))[0].totalPurchases = s.totalPurchases;
            // });

            // votes.forEach(function (s) {
            //     var artist = artists.filter(matchId(s._id))[0];
            //     artist.totalPurchases = (artist.totalPurchases || 0) + s.totalPurchases * (config.payment.paidVotePrice.USD.artist);
            // });
            // Iterate _payment to get the totalpurchase of the artist
            _payments.forEach(function (s) {
                if (s.totalPurchases) {
                    artists.filter(matchId(s._id))[0].totalPurchases = s.totalPurchases;
                }else {
                    artists.filter(matchId(s._id))[0].totalPurchases  = 0;
                }
            });
            // Iterate _votes to get the totalpurchase and totalvotes of the artist
            _votes.forEach(function (s) {
                if (s.totalPurchases) {
                    var artist = artists.filter(matchId(s._id))[0];
                    artist.totalPurchases = (artist.totalPurchases || 0) +
                                s.totalPurchases * (config.payment.paidVotePrice.USD.artist);
                    artist.totalVotes = s.totalVotes;
                }else {
                    artists.filter(matchId(s._id))[0].totalPurchases  = 0;
                }
            });
            reply({
                total: Math.ceil(count),
                artists: artists
            });
        }).fail(function (err) {
            reply(err);
        });
    },
    /**
    *   @function
    *   @name Controller:artists.active
    *   @desc This function is used to get all the artist according
    *   to the filter applied by the user and whose profile is complete
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    active: function (req, reply) {
        var query = setQuery(req);
        if (!query.$and) {
            query.$and = [];
        }

        query.$and.push({
            state: 'active',
            isComplete: true
        });

        var sortBy = req.query.sort || '-createdAt';
        var page = req.query.page - 1;
        var pageSize = req.query.pagesize || 15;

        if (page !== null && pageSize !== null) {
            Q.all([
                Artist.count(query).exec(),
                Artist.find(query, '-salt -hashedPassword').sort(sortBy).skip(pageSize * page).limit(pageSize).exec()
            ])
                .then(function (artists) {
                    reply({
                        pages: Math.ceil((artists[0] / pageSize) * 10) / 10,
                        artists: artists[1]
                    });
                });
        } else {
            Artist.find(query, '-salt -hashedPassword').sort(sortBy).exec()
                .then(function (artists) {
                    reply(artists);
                });
        }
    },

    /**
    *   @function
    *   @name Controller:artists.index
    *   @desc This function is used all the artist according to the filter
    *   applied by the user
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    index: function (req, reply) {
        // Assigning sorting order
        var sortBy = req.query.sort || '-createdAt';
        var query, page, pageSize;
        // check if there is id of the artist pass in the url
        // if there is id then return the detail of that artist
        if (req.params.id) {
            getById(req, reply);
        } else if (!req.query.sort || req.query.sort === 'recommendation') {
            page = req.query.page > 0 ? req.query.page - 1 : 0;
            pageSize = req.query.pagesize || 20;
            var usergenres = req.query.usergenres ? req.query.usergenres.split(',') || [req.query.usergenres] : [];
            var artists;
            var count;
            // Calling the function setQuery to get the query according
            // to the filter applied by the user
            query = setQuery(req);
            Q.all([
                Artist.aggregate([{
                    $match: query
                }, {
                    $project: {
                        _id: 1,
                        name: 1,
                        genres_music: 1,
                        slug: 1,
                        country: 1,
                        featured: 1,
                        picture: 1,
                        fans: 1,
                        fans_a: 1,
                        credits: 1,
                        totalPlays: 1,
                        createdAt: 1,
                        fanCount: 1,
                        matches: {
                            $add: [{
                                $cond: [{
                                    $or: [{
                                        $eq: ['$featured', true]
                                    }, {
                                        $eq: ['$featured', 'on']
                                    }]
                                },
                                    3, 0
                                ]
                            }, {
                                $size: {
                                    $setIntersection: ['$genres_music', usergenres]
                                }
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
                Artist.count(query).exec()
            ]).spread(function (_artists, _count) {
                count = _count;
                artists = _artists;
                var ids = artists.map(function (artist) {
                    return artist._id;
                });
                return getPurchases(ids);
            }).spread(function (payments, votes) {
                payments.forEach(function (s) {
                    artists.filter(matchId(s._id))[0].totalPurchases = s.totalPurchases;
                });

                votes.forEach(function (s) {
                    var artist = artists.filter(matchId(s._id))[0];
                    artist.totalPurchases = (artist.totalPurchases || 0) + s.totalPurchases * (config.payment.paidVotePrice.USD.artist);
                });

                reply({
                    pages: Math.ceil((count / pageSize) * 10) / 10,
                    artists: artists
                });
            }).fail(function (err) {
                console.error(err);
                reply(err);
            });
        } else {

            query = setQuery(req);

            page = req.query.page >= 0 ? req.query.page - 1 : null;
            pageSize = req.query.pagesize || 20;

            page = page < 0 ? 0 : page;

            if (page !== null && pageSize !== null) {

                Q.all([
                    Artist.count(query).exec(),
                    Artist.find(query, '-salt -hashedPassword').sort(sortBy).skip(pageSize * page).lean(true).limit(pageSize).exec()
                ])
                    .spread(function (_count, _artists) {
                        count = _count;
                        artists = _artists;
                        var ids = artists.map(function (artist) {
                            return artist._id;
                        });

                        if (pageSize > 100 || !pageSize) {
                            return Q.resolve([]);
                        }

                        return getPurchases(ids);
                    }).spread(function (payments, votes) {
                        payments.forEach(function (s) {
                            artists.filter(matchId(s._id))[0].totalPurchases = s.totalPurchases;
                        });

                        votes.forEach(function (s) {
                            var artist = artists.filter(matchId(s._id))[0];
                            artist.totalPurchases = (artist.totalPurchases || 0) + s.totalPurchases * (config.payment.paidVotePrice.USD.artist);
                        });

                        reply({
                            pages: Math.ceil((count / pageSize) * 10) / 10,
                            artists: artists
                        });
                    }).fail(function (err) {
                        console.error(err);
                        reply(err);
                    });
            } else {
                Artist.find(query, '-salt -hashedPassword').sort(sortBy).exec()
                    .then(function (artists) {
                        reply(artists);
                    });
            }
        }
    },

    /**
    *   @function
    *   @name Controller:artists.create
    *   @desc Create a new artist
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    */
    create: function (req, reply) {
        var newArtist = new Artist(req.payload);
        // Making the state of the artist pending
        newArtist.state = 'pending';
        // Check if user is login using his/her facebook id
        if (newArtist.facebookId) {
            newArtist.save(function (err, obj) {
                if (!err) {
                    reply(obj.userInfo);
                } else {
                    return reply(reformatErrors(err));
                }
            });
        } else {
            // if user is login after registration
            newArtist.setPassword(req.payload.password, function (err) {
                if (err) {
                    return reply(reformatErrors(err));
                }
                if (process.env.NODE_ENV === 'test') {
                    newArtist.isComplete = true;
                }
                // save the new artist
                newArtist.save(function (err, obj) {
                    if (!err) {
                        reply(obj.userInfo);
                    } else {
                        return reply(reformatErrors(err));
                    }
                });
            });
        }
    },

    /**
    *   @function
    *   @name Controller:artists.totalPlays
    *   @desc Get total plays of a specific artist, given the req.params.id
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    totalPlays: function (req, reply) {
        var mongoose = require('mongoose');
        var id = mongoose.Types.ObjectId(req.params.id);
        // find the sum of total play of the song of particular artist
        Song.aggregate([{
            $match: {
                artist: id,
                state: 'active'
            }
        }, {
            $group: {
                _id: '$artist',
                plays: {
                    $sum: '$plays'
                }
            }
        }]).exec(function (err, res) {
            if (err) {
                return reply(err);
            }
            reply(res);
        });
    },

    /**
    *   @function
    *   @name Controller:artists.updatePayPalAccount
    *   @Desc Update paypal account of a specific artist, given the req.params.id
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    updatePayPalAccount: function (req, reply) {
        var artistId = req.params.id;

        //console.log('Updating artist: ' + artistId + ' PayPal data...');

        console.log();
        console.log('Updating artist PayPal account using ArtistController:updatePayPalAccount');
        console.log();
        Artist.updatePayPalAccount(
            artistId,
            req.payload.paypal_email,
            req.payload.paypal_firstname,
            req.payload.paypal_lastname,
            req.payload.paypal_currency,
            req.payload.paypal_verified)
            .then(function () {
                reply({
                    status: 'OK'
                }).code(200);
            })
            .fail(function (err) {
                console.error(err);
                reply(Hapi.error.badRequest);
            });
    },

    /**
    *   @function
    *   @name Controller:artists.update
    *   @desc Update artist's data
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    update: function (req, reply) {
        // Call the mongo query findArtist declare on the top
        findArtist({
            _id: req.params.id
        }, '-salt -hashedPassword')
            .then(function (artist) {
                if (!artist) {
                    reply(Hapi.error.notFound());
                    return;
                }
                req.payload.isComplete = true;
                // Call the safeUpdate method which was chained in artist schema
                return artist.safeUpdate(req.payload, 'profile');
            })
            .then(function (data) {
                return reply(data[0]);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },

    /**
    *   @function
    *   @name Controller:artists.update
    *   @desc Update artist's setting
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    updateBasicSettings: function (req, reply) {
        var artist;
        // Call the mongo query findArtist declare on the top
        findArtist({
            _id: req.params.id
        }).then(function (_artist) {
            artist = _artist;
            if (!artist) {
                reply(Hapi.error.notFound());
                return;
            }

            artist.notifications = isTrue(req.payload.notifications);
            artist.newsletter = isTrue(req.payload.newsletter);
            artist.activitystream = isTrue(req.payload.activitystream);
            artist.preferredCountry = req.payload.preferredCountry;
            artist.currency = req.payload.currency;
            artist.arena = req.payload.arena;
            // save the update profile of artist
            Q.ninvoke(artist, 'save');
        })
            .then(function () {
                return reply(artist);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },

    /**
     *   @desc  This function call to add the fan in the artist schema
     *   @function
     *   @name Controller:artists.fan
     *   @param {object} req - Request object
     *   @param {function} reply - hapi reply interface
     **/
    fan: function (req, reply) {
        var artist;

        // search for the artist of which we want to become fan
        // by using the id that come in the url
        Q.ninvoke(Artist.findOne({
            _id: req.params.id
        }, '_id name'), 'exec')
            .then(function (_artist) {
                artist = _artist;
                if (!artist) {
                    reply(Hapi.error.notFound());
                    return;
                }

                var type = req.payload.type === 'fan' ? 'fan' : 'artist';
                // Call the function of artist model :  addFan
                // addFan function is define in modal/artist.js
                // This is the method of  artist schema and can be called from any where
                // for artist schema
                return artist.addFan(type, req.payload._id);
            })
            .then(function (artist) {

                if (artist) {
                    return reply(artist);
                } else {
                    return reply({
                        "Message": "Either_it_a_duplicate_entry_or_an_error_on_backend"
                    }).code(400);
                }
            })
            .fail(function (err) {
                console.log(err.stack);
                return reply(reformatErrors(err));
            });
    },

    /**
    *   @function
    *   @name Controller:artists.verify
    *   @desc Set a specific artist as verified
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    */
    verify: function (req, reply) {
        // Call the mongo query findArtist declare on the top
        findArtist({
            _id: req.params.id
        }, '-salt -hashedPassword')
            .then(function (artist) {
                if (!artist) {
                    reply(Hapi.error.notFound());
                    return;
                }
                req.payload.notifications = artist.notifications;
                req.payload.activitystream = artist.activitystream;
                // call the safe update function of artist schema
                return artist.safeUpdate(req.payload, 'profile');
            })
            .then(function (data) {
                return reply(data[0]);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },

    /**
    *   @function
    *   @name Controller:artists.delete
    *   @desc Delete an artist
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    delete: function (req, reply) {
        // Call the mongo query findone to find the artist using the id
        Artist.findOne({
            _id: req.params.id
        }, function (err, artist) {
            if (err) {
                reply(Hapi.error.notFound());
            }
            // remove the artist
            artist.remove(function (err) {
                if (err) {
                    reply(Hapi.error.internal('internal', err));
                }
                reply('');
            });

        });
    },

    /**
    *   @function
    *   @name Controller:artists.authenticate
    *   @desc Authenticate an artist
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    authenticate: function (req, reply) {
        req.payload.email = req.payload.email.toLowerCase();
        // Call the mongo query findone to find the artist using the id
        Artist.findOne({
            email: req.payload.email
        }, function (err, artist) {
            if (err) {
                return reply(reformatErrors(err));
            }
            if (!artist) {
                return reply(Hapi.error.notFound());
            }
            if (artist.email !== req.payload.email) {
                reply(Hapi.error.unauthorized('nope'));
            }
            // authenticate the artist
            Q.ninvoke(artist, 'authenticate', req.payload.password)
                .then(function (authArtist) {
                    if (authArtist) {
                        return authArtist.setLoginTimestamp();
                    }
                    reply(Hapi.error.unauthorized('nope'));
                })
                .then(function () {
                    reply({
                        artist: artist.userInfo
                    });
                })
                .fail(function () {
                    reply(Hapi.error.unauthorized('nope'));
                });

        });
    },


    /**
    *   @function
    *   @name Controller:artists.authenticateValidate
    *   Authenticate and verify an artist
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    */
    // TODO: What's the difference with authenticate?
    authenticateValidate: function (req, reply) {
        Artist.findOne({
            email: req.payload.email
        }, function (err, artist) {
            if (err) {
                return reply(reformatErrors(err));
            }
            if (!artist) {
                return reply(Hapi.error.notFound());
            }
            if (artist.email !== req.payload.email) {
                reply(Hapi.error.unauthorized('nope'));
            }
            Q.ninvoke(artist, 'authenticate', req.payload.password)
                .then(function (authArtist) {
                    if (authArtist[0] === false) {
                        return reply(Hapi.error.unauthorized('nope'));
                    }
                    return reply({
                        artist: artist.userInfo
                    });
                })
                .fail(function () {
                    reply(Hapi.error.unauthorized('nope'));
                });
        });
    },

    // Get contest metadata about a specific user
    contestMeta: function (req, reply) {
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

        // var result = [] ;
        // { _id: '', name: '', plays: 0, votes: 0, credits: 0 }

        findArtist(query, '_id')
            .then(function (artist) {

                var payload = [{
                    $match: {
                        // status: 'processed',
                        // type: { $ne: 'dummy' },
                        artist: artist._id
                    }
                }, {
                    $group: {
                        _id: '$contest',
                        votes: {
                            $sum: '$votes'
                        },

                        np: {
                            $sum: {
                                $cond: [{
                                    $eq: ['$phase', 'np']
                                }, '$votes', 0]
                            }
                        },
                        globalfinalsQualification: {
                            $sum: {
                                $cond: [{
                                    $eq: ['$phase', 'globalfinalsQualification']
                                }, '$votes', 0]
                            }
                        },
                        globalfinalsBest64: {
                            $sum: {
                                $cond: [{
                                    $eq: ['$phase', 'globalfinalsBest64']
                                }, '$votes', 0]
                            }
                        },
                        globalfinalsBest16: {
                            $sum: {
                                $cond: [{
                                    $eq: ['$phase', 'globalfinalsBest16']
                                }, '$votes', 0]
                            }
                        },
                        phases: {
                            $push: '$phase'
                        },
                        lastPhase: {
                            $last: '$phase'
                        },
                        song: {
                            $first: '$song'
                        },
                        credits_dollar: {
                            $sum: {
                                $multiply: ['$voteTypes.purchase', config.payment.paidVotePrice.USD.artist]
                            }
                        }
                    }
                }];

                return Q.ninvoke(ChartEntry, 'aggregate', payload);

            })
            .then(function (chartEntries) {
                Contest.populate(chartEntries, [{
                    path: '_id',
                    select: 'name',
                    model: 'Contest'
                }, {
                    path: 'song',
                    select: 'plays',
                    model: 'Song'
                }], function (err, res) {
                    reply(res.map(function (entry) {
                        entry.votes = entry[entry.lastPhase];
                        entry.plays = entry.song.plays;
                        entry.name = entry._id.name;
                        entry.id = entry._id._id;

                        delete entry._id;
                        delete entry.globalfinalsQualification;
                        delete entry.globalfinalsBest64;
                        delete entry.globalfinalsBest16;
                        delete entry.np;
                        delete entry.song;
                        delete entry.phases;

                        return entry;
                    }));
                });
                return;
            }).fail(function (err) {
                reply(err);
                console.log(err.stack);
            });
    },

    /**
    *   @function
    *   @name Controller:artists.stateChange
    *   Change the state of a specific user
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    **/
    stateChange: function (req, reply) {
        // find the selected artist using id
        Artist.findOne({
            _id: req.params.id
        }).exec(function (err, artist) {
            if (err) {
                reply(Hapi.error.notFound());
            }

            // get the old state of the artist
            var oldState = artist.get('state');
            if (oldState === req.payload.state) {
                return reply(artist);
            }

            artist.state = req.payload.state;
            var stateHistory = {
                from: oldState,
                to: req.payload.state,
                category: req.payload.category,
                comment: req.payload.comment,
                createdAt: new Date()
            };
            artist.stateHistory.push(stateHistory);
            // saving the updated state of the artist
            artist.save(function (err, artist) {
                if (!err) {
                    unagi.fire('artists:statechange', {
                        state: stateHistory,
                        data: artist
                    });

                    reply(artist);
                } else {
                    return reply(reformatErrors(err));
                }
            });
        });
    },

    // token_authenticate: function( req, reply ) {
    //     Artist.findOne({ face})
    // },

    /**
     * Authenticate or add a new user using Facebook login
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    facebook_authenticate: function (req, reply) {
        Artist.findOne({
            facebookId: req.payload.facebookId
        }, function (err, artist) {
            if (err) {
                return reply(reformatErrors(err));
            }

            if (!artist) {
                var newArtist = new Artist(req.payload);
                newArtist.save(function (err, saveArtist) {
                    if (err) {
                        return reply(reformatErrors(err));
                    }
                    reply({
                        isNew: true,
                        artist: saveArtist.userInfo
                    });
                });
            } else {
                reply({
                    isNew: false,
                    artist: artist.userInfo
                });
            }
        });
    },

    /**
     * Verify if a user is active in current contest
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    activeInCurrentContest: function (req, reply) {
        currentContest().then(function (contest) {
            return Q.ninvoke(ChartEntry, 'count', {
                phase: contest.theReallyCurrentPhase()[0],
                contest: contest._id,
                artist: req.params.id
            });
        }).then(function (count) {
            reply(count > 0);
        }).fail(function (err) {
            console.error(err);
            console.error(err.stack);
            reply(err);
        });
    },

    /**
     * Notify a missed vote
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    notifyMissedVote: function (req, reply) {

        Q.all([
            Q.ninvoke(Artist, 'findOne', {
                slug: req.params.id
            }),
            Q.ninvoke(MissedVote, 'count', {
                artist: req.params.id,
                voter_type: req.payload.voter_type,
                voter_id: req.payload.voter_id
            })
        ]).spread(function (artist, count) {
            if (count) {
                reply({
                    status: 'already-voted'
                });
            } else {
                unagi.enqueue('artists:missed-vote', artist);
                MissedVote.create({
                    artist: req.params.id,
                    voter_type: req.payload.voter_type,
                    voter_id: req.payload.voter_id
                }, function (err) {
                    console.log(err);
                });
                reply({
                    status: 'email-sent'
                });
            }
        })
            .fail(function (err) {
                reply(err);
                console.log(err);
            });
    },

    /**
     * Add facebook pages to an artist profile
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    addFacebookPages: function (req, reply) {
        var updates = [];

        req.payload.pages.forEach(function (page) {
            updates.push(Q.ninvoke(Artist, 'update', {
                facebookPages: page
            }, {
                $pull: {
                    facebookPages: page
                }
            }, {
                multi: true
            }));
        });

        Q.all(updates).then(function () {
            Artist.update({
                slug: req.params.slug
            }, {
                $addToSet: {
                    facebookPages: {
                        $each: req.payload.pages
                    }
                }
            }, function (err) {
                if (err) {
                    console.error(err);
                    console.error(err.stack);
                }
                reply(err);
            });
        });
    },

    /**
     * Get artists based on facebook page ID
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    getArtistFromFacebookPageId: function (req, reply) {
        Artist.findOne({
            facebookPages: req.params.facebookPageId,
            state: {
                $in: ['active', 'pending']
            }
        }, {
            slug: 1
        }, function (err, artist) {
            if (err) {
                console.error(err);
                console.error(err.stack);
                return reply(err);
            }
            reply(artist);
        });
    },

    /**
     * Get artists of which an artist is fan
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    getFanOfArtist: function (req, reply) {
        Q.ninvoke(Artist.findOne({slug: req.params.slug}).select('_id slug fan_of_artist'), 'exec')
            .then(function (artist) {
                console.log(JSON.stringify(artist));
                reply(artist);
            })
            .fail(function (err) {
                reply(err);
                console.log(err);
            });
    },

    /**
     * Check if the given artist is participating in the cfe (current call for entry)
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    participatingInCurrentCfe: function (req, reply) {
        Q.all([
            Q.ninvoke(Song, 'find', {
                artist: req.params.artistId,
                state: {$in: ['active', 'pending']},
                contest: {$exists: true}
            }, {contest: true}),
            Q.ninvoke(Contest, 'inCfe')
        ]).spread(function (songs, contest) {
            if (!contest) {
                return reply({participating: false});
            }

            var participatingSongs = songs.filter(function (song) {
                return song.contest === contest._id.toString();
            });

            reply({participating: participatingSongs.length > 0});
        }).fail(function (err) {
            console.error(err);
            console.error(err.stack);
            reply(err);
        });
    },

    /**
     * Set the preferred media to associate to an artist profile (can be a song or a video)
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    setPreferredMedia: function (req, reply) {

        // Id of the media
        var mediaId = req.payload.preferredMedia,
        // Type of the media (song or video)
            mediaType = req.payload.preferredMediaType;

        var processMedia = function (mediaId, mediaType, model, artist, reply) {
            model.findOne({_id: mediaId}, function (err, modelInstance) {
                if (err) {
                    return reply(reformatErrors(err));
                }
                //console.log('video found:', video.title);

                // Save the preferred media in artist
                artist.preferredMedia = modelInstance._id;
                artist.preferredMediaType = mediaType;

                artist.save(function (err, savedArtist) {
                    if (err) {
                        return reply(reformatErrors(err));
                    }
                    Artist.populate(savedArtist, {
                        path: 'preferredMedia',
                        model: model
                    }, function (err, populatedArtist) {
                        if (err) {
                            return reply(reformatErrors(err));
                        }
                        reply(populatedArtist);
                    });
                });
            });
        };

        Artist.findOne({_id: req.params.id}, function (err, artist) {
            if (err) {
                return reply(reformatErrors(err));
            }
            if (mediaType === 'video') {
                processMedia(mediaId, mediaType, Video, artist, reply);
            } else if (mediaType === 'song') {
                processMedia(mediaId, mediaType, Song, artist, reply);
            }
        });
    },

    /**
     * Set the contest media to associate to an artist profile (can be a song or a video)
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    setContestMedia: function (req, reply) {

        var errorResponse = {error: "Media has already been associated with another contest"};

        var removeContestFromSongOrVideo = function (artistId, contestId) {

            var query = [{artist: artistId}, {contest: contestId}];

            Q.all([
                Song.find().and(query).exec(),
                Video.find().and(query).exec()
            ]).then(function (results) {
                var songAndVideos = results[0].concat(results[1]);
                songAndVideos.forEach(function (element) {
                    element.contest = undefined;
                    element.save();
                });
            });
        };

        var processMedia = function (mediaId, mediaType, model, artist, contest, reply) {
            model.findOne({_id: mediaId}, function (err, modelInstance) {
                if (err) {
                    return reply(reformatErrors(err));
                }

                // Set video as contest media
                if (artist.canChangeContestMedia(modelInstance, contest)) {

                    // Find songs and videos that already participate in this contest and delete the contest association
                    removeContestFromSongOrVideo(artist.id, contest.id);

                    // Save the contest id in song or video
                    modelInstance.contest = contest._id;
                    modelInstance.save();

                    // Save the contest media in artist
                    artist.contestMedia = modelInstance._id;
                    artist.contestMediaType = mediaType;

                    artist.save(function (err, savedArtist) {
                        if (err) {
                            return reply(reformatErrors(err));
                        }
                        Artist.populate(savedArtist, {
                            path: 'contestMedia',
                            model: model
                        }, function (err, populatedArtist) {
                            if (err) {
                                return reply(reformatErrors(err));
                            }
                            reply(populatedArtist);
                        });
                    });
                } else {
                    // TODO: Find a good solution to reply this error
                    reply(errorResponse).code(400);
                }
            });
        };

        // Id of the media
        var mediaId = req.payload.contestMedia,
        // Type of the media (song or video)
            mediaType = req.payload.contestMediaType;

        Q.all([
            Artist.findOne({_id: req.params.id}).exec(),
            Q.ninvoke(Contest, 'current')
        ]).then(function (results) {
            var artist = results[0],
                contest = results[1][0];

            if (mediaType === 'video') {
                processMedia(mediaId, mediaType, Video, artist, contest, reply);
            } else if (mediaType === 'song') {
                processMedia(mediaId, mediaType, Song, artist, contest, reply);
            }
        }).fail(function (err) {
            return reply(reformatErrors(err));
        });
    }
};
