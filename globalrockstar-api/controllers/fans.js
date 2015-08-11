'use strict';
/**
*   @module Controller:Fans
*   @description Provides information about fans
*   @requires module:mongoose
*   @requires module:hapi
*   @requires module:../config
*   @requires module:../lib/mongoose-hapi-errors
*   @requires module:q
*   @requires module:node-redis-pubsub
*   @requires module:../lib/is-true
*   @requires modulelodash
*/

var mongoose = require('mongoose');
var Fan = mongoose.model('Fan');
var Artist = mongoose.model('Artist');
var Vote = mongoose.model('Vote');
var Song = mongoose.model('Song');
var ChartEntry = mongoose.model('ChartEntry');
var Payment = mongoose.model('Payment');
var Project = mongoose.model('Project');
var Contest = mongoose.model('Contest');
var Hapi = require('hapi');
var config = require('../config');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var Q = require('q');
var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);
var isTrue = require('../lib/is-true');
var _ = require('lodash');
var prop = _.property;
var findFan = Q.nbind(Fan.findOne, Fan);
var MediaLibrary = mongoose.model('MediaLibrary');
var Song = mongoose.model('Song');

/**
*   @function Controller:Fans.populateSongs
*   @param {object} s activity object
*   @description This is for songs details
*   @callback return object
*   @returns {Object} songs object after populating
*/
function populateSongs(s, callback) {
    Song.findOne({_id: s})
        .populate('artist', '_id name')
        .exec(function (err, result) {
            if (!err) {
                callback(result);
            }
        }
    );
}

function groupPayments(payments) {
    var grouped = [];
    payments.forEach(function (payment) {
        var project = grouped.filter(function (g) {
            return g.projectId === payment.target.project;
        })[0];
        if (project) {
            project.amount = project.amount + payment.dollarAmount;
        } else {
            grouped.push({
                projectId: payment.target.project,
                amount: payment.dollarAmount
            });
        }
    });

    return grouped;
}

/**
*   @function
*   @name Controller:fans.matchId
*   @description This function is used to match the id
*   which the id of the object
**/
function matchId(id) {
    return function (obj) {
        return obj._id.toString() === id.toString();
    };
}

/**
*   @function
*   @name Controller:fans.getParticipant
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
module.exports = {
    /**
     * Get all fans or a single fan given the fan's id (req.params.id)
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    index: function (req, reply) {

        var sortBy = req.query.sort || 'createdAt',
            query = null;

        if (req.params.id) {
            query = {$or: [{slug: req.params.id}]};
            var fan, payments;
            if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({_id: req.params.id});
            }

            // TODO: make this regexp work ;)
            if (req.params.id.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/)) {
                query.$or.push({'email': req.params.id});
            }

            if (req.params.id.indexOf('@') !== -1) {
                query.$or.push({'email': req.params.id});
            }

            Fan.findOne(query, '-salt -hashedPassword').sort(sortBy).lean(true).exec()
                .then(function (_fan) {
                    fan = _fan;
                    if (!fan) {
                        return reply(Hapi.error.notFound());
                    }

                    return Q.ninvoke(Payment, 'find', {
                        'source.fan': fan._id,
                        'source.type': 'Fan',
                        'target.type': 'Project',
                        state: 'completed'
                    });
                }).then(function (_payments) {
                    payments = groupPayments(_payments);
                    var projectIds = payments.map(prop('projectId'));
                    return Q.ninvoke(Project, 'find', {_id: {$in: projectIds}}, {title: 1});
                }).then(function (projects) {
                    payments.forEach(function (payment) {
                        var project = projects.filter(function (project) {
                            return project._id.toString() === payment.projectId;
                        })[0];
                        payment.title = project.title;
                    });
                    fan.expenses = {
                        projects: payments
                    };

                    reply(fan);
                }, function (err) {
                    if (err) {
                        console.error(err.stack);
                        return reply(reformatErrors(err));
                    }
                });

        } else {

            query = req.pre.search || {};
            var page = req.query.page >= 0 ? req.query.page - 1 : null;
            var pageSize = req.query.pagesize || 20;

            page = page < 0 ? 0 : page;

            if (page !== null && pageSize !== null) {

                Q.all([
                    Fan.count(query).exec(),
                    Fan.find(query, '-salt -hashedPassword')
                        .sort(sortBy).skip(pageSize * page)
                        .limit(pageSize).exec()
                ])
                    .then(function (fans) {
                        reply({
                            pages: Math.ceil((fans[0] / pageSize) * 10) / 10,
                            fans: fans[1]
                        });
                    }).fail(function (err) {
                        reply(err);
                    });
            } else {
                Fan.find(query, '-salt -hashedPassword').sort(sortBy).exec()
                    .then(function (fans) {
                        reply(fans);
                    });
            }

        }
    },

    /**
     * Create a new fan
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    create: function (req, reply) {
        var fan = new Fan(req.payload);
        fan.state = 'pending';
        fan.setPassword(req.payload.password, function (err) {
            if (err) {
                return reply(reformatErrors(err));
            }
            fan.save(function (err, obj) {
                if (!err) {
                    reply(obj.userInfo);
                } else {
                    return reply(reformatErrors(err));
                }

            });
        });
    },

    /**
     * Initialize a new fan
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    update: function (req, reply) {
        findFan({_id: req.params.id}, '-salt -hashedPassword')
            .then(function (fan) {
                if (!fan) {
                    reply(Hapi.error.notFound());
                    return;
                }

                return fan.safeUpdate(req.payload, 'profile');
            })
            .then(function (data) {
                return reply(data[0]);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },

    /**
     * Update only the basic settings of a fan
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    updateBasicSettings: function (req, reply) {
        var fan;
        findFan({
            _id: req.params.id
        }).then(function (_fan) {
            fan = _fan;
            if (!fan) {
                reply(Hapi.error.notFound());
                return;
            }

            fan.notifications = isTrue(req.payload.notifications);
            fan.newsletter = isTrue(req.payload.newsletter);
            fan.activitystream = isTrue(req.payload.activitystream);
            fan.preferredCountry = req.payload.preferredCountry;
            fan.currency = req.payload.currency;
            fan.arena = req.payload.arena;
            Q.ninvoke(fan, 'save');
        })
            .then(function () {
                return reply(fan);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },

    /**
     *
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    stateChange: function (req, reply) {
        Fan.findOne({_id: req.params.id}).exec(function (err, fan) {
            if (err) {
                reply(Hapi.error.notFound());
            }

            var oldState = fan.get('state');
            if (oldState === req.payload.state) {
                return reply(fan);
            }

            fan.state = req.payload.state;
            var stateHistory = {
                from: oldState,
                to: req.payload.state,
                category: req.payload.category,
                comment: req.payload.comment,
                createdAt: new Date()
            };
            fan.stateHistory.push(stateHistory);

            fan.save(function (err, fan) {
                if (!err) {
                    unagi.emit('fans:statechange', {state: stateHistory, data: fan});
                    reply(fan);
                } else {
                    return reply(reformatErrors(err));
                }
            });
        });
    },


    /**
     * Set the fan's verified parameter assignin the current date
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    verify: function (req, reply) {
        findFan({_id: req.params.id}, '-salt -hashedPassword')
            .then(function (fan) {
                if (!fan) {
                    reply(Hapi.error.notFound());
                    return;
                }
                req.payload.notifications = fan.notifications;
                req.payload.activitystream = fan.activitystream;
                return fan.safeUpdate(req.payload, 'profile');
            })
            .then(function (data) {
                return reply(data[0]);
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },


    /**
     * Delete a fan
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    delete: function (req, reply) {
        Fan.findOne({_id: req.params.id}, function (err, fan) {
            if (err) {
                reply(Hapi.error.notFound());
            }

            fan.remove(function (err) {
                if (err) {
                    reply(Hapi.error.internal('internal', err));
                }
                reply('');
            });

        });
    },

    /**
     * Authenticate a fan
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    authenticate: function (req, reply) {
        req.payload.email = req.payload.email.toLowerCase();
        Fan.findOne({email: req.payload.email}, function (err, fan) {
            if (err) {
                return reply(reformatErrors(err));
            }
            if (!fan) {
                return reply(Hapi.error.notFound());
            }
            if (fan.email !== req.payload.email) {
                reply(Hapi.error.unauthorized('nope'));
            }

            Q.ninvoke(fan, 'authenticate', req.payload.password)
                .then(function (authFan) {
                    if (authFan) {
                        return authFan.setLoginTimestamp();
                    }
                    reply(Hapi.error.unauthorized('nope'));
                })
                .then(function () {
                    reply({fan: fan.userInfo});
                })
                .fail(function () {
                    reply(Hapi.error.unauthorized('nope'));
                });

        });
    },

    /**
     * Authenticate and verify a fan
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    // TODO: What's the difference with authenticate?
    authenticateValidate: function (req, reply) {
        Fan.findOne({email: req.payload.email}, function (err, fan) {
            if (err) {
                return reply(reformatErrors(err));
            }
            if (!fan) {
                return reply(Hapi.error.notFound());
            }
            if (fan.email !== req.payload.email) {
                reply(Hapi.error.unauthorized('nope'));
            }

            Q.ninvoke(fan, 'authenticate', req.payload.password)
                .then(function (authFan) {
                    if (authFan[0] === false) {
                        return reply(Hapi.error.unauthorized('nope'));
                    }
                    return reply({artist: fan.userInfo});
                })
                .fail(function () {
                    reply(Hapi.error.unauthorized('nope'));
                });

        });
    },

    /**
     * Authenticate or add a new fan using Facebook login
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    facebook_authenticate: function (req, reply) {
        if (!req.payload.email) {
            return reply(Hapi.error.notFound);
        }
        Fan.findOne({email: req.payload.email}, function (err, fan) {
            if (err) {
                return reply(reformatErrors(err));
            }

            if (!fan) {
                var newFan = new Fan(req.payload);
                newFan.verified = new Date();
                newFan.state = 'active';
                newFan.save(function (err, saveFan) {
                    if (err) {
                        return reply(reformatErrors(err));
                    }
                    reply({isNew: true, fan: saveFan.userInfo});
                });
            } else {
                if (!fan.facebookId) {
                    fan.facebookId = req.payload.facebookId;
                    fan.save(function (err) {
                        if (err) {
                            console.error(err);
                            console.error(err.stack);
                        }
                    });
                }
                reply({isNew: false, fan: fan.userInfo});
            }
        });
    },
    /**
    *   @function Controller:fans.statistics
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    *   @description Get stats about a defined fan
    *   @callback return object
    *   @returns {Object} stats lists
    */
    statistics: function (req, reply) {
        Vote.aggregate([{
            $match: {
                voter_fan: mongoose.Types.ObjectId(req.params.id),
                type: {$in: ['facebook', 'twitter', 'purchase', 'bonus', 'fan']},
                status: 'processed'
            }
        }, {
            $group: {
                _id: {fan: '$voter_fan', contest: '$contest', phase: '$phase'},
                votes: {$sum: 1},
                twitter: {$sum: {$cond: [{$eq: ['$type', 'twitter']}, 1, 0]}},
                facebook: {$sum: {$cond: [{$eq: ['$type', 'facebook']}, 1, 0]}},
                purchase: {$sum: {$cond: [{$eq: ['$type', 'purchase']}, 1, 0]}},
                purchase_dollar: {$sum: {$cond: [{$eq: ['$type', 'purchase']}, 1, 0]}},
                mobile: {$sum: {$cond: [{$ne: ['$platform', 'desktop']}, 1, 0]}},
                series: {$sum: {$cond: [{$eq: ['$series_vote', true]}, 1, 0]}}
            }
        }
        ], function (err, stats) {
            if (err) {
                return reply(err);
            }
            Contest.populate(stats, [{
                path: '_id.contest',
                select: 'name',
                model: 'Contest'
            }], function (err) {
                if (err) {
                    return reply(err);
                }
                var result = stats.map(function (entry) {
                    entry.purchase -= entry.series;
                    entry.purchase_dollar -= entry.series;
                    return entry;
                });
                if (err) {
                    return reply(err);
                }
                reply(result);
            });

        });
    },
    /**
    *   Get fans of a specific artist given the artis's slug (slug: req.params.slug)
    *
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    */
    getFanOfArtist: function (req, reply) {
        Q.ninvoke(Fan.findOne({slug: req.params.slug}).select('_id slug fan_of_artist'), 'exec')
            .then(function (fan) {
                console.log(JSON.stringify(fan));
                reply(fan);
            })
            .fail(function (err) {
                reply(err);
                console.log(err);
            });
    },
    /**
    *   @function
    *   @name Controller:fans.detail
    *   @desc This function is used get the votes that fan given,
    *   project that fan support ,artist that fan follow and the
    *   count of songs that fan play or listen
    **/
    detail: function (req, reply) {
        var sortBy = req.query.sort || 'createdAt',
            query = null;
        // query to store slug
        query = {$or: [{slug: req.params.id}]};
        var fan = {}, payments;
        // condition to check the if we get id in response
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }

        // TODO: make this regexp work ;)
        // condition to check if we get email in request
        if (req.params.id.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/)) {
            query.$or.push({'email': req.params.id});
        }

        if (req.params.id.indexOf('@') !== -1) {
            query.$or.push({'email': req.params.id});
        }
        // Find the fan using the query
        Q.ninvoke(Fan.findOne(query, '_id fan_of_artist')
            .sort(sortBy).lean(true), 'exec')
        .then(function (_fan) {
            if (!_fan || _fan === undefined) {
                return reply(Hapi.error.notFound());
            }

            fan = _fan;
            // Get detail of all the payment done by the fan and
            // whose state is complete
            return Q.ninvoke(Payment, 'find', {
                'source.fan': fan._id,
                'source.type': 'Fan',
                'target.type': 'Project',
                state: 'completed'
            });
        }).then(function (_payments) {
            if (!_payments || _payments === undefined) {
                return reply(Hapi.error.notFound());
            }
            payments = groupPayments(_payments);

            var projectIds = payments.map(prop('projectId'));
            // Fire the multiple query in parallel to get the project that are
            // supported by the fan and also the count of votes that fan gave
            return Q.all([
                Q.ninvoke(Project, 'find', {_id: {$in: projectIds}}, {title: 1}),
                Q.ninvoke(Vote.count({"voter_fan" : fan._id}), 'exec')
            ]);
        }).spread(function (projects, votes) {
            fan.totalVotes = votes;
            /*var artistId = _.pluck(votes, 'artist');
            var artistUniqueId = _.uniq(artistId, function (id) {
                return JSON.stringify(id);
            });*/
            if (projects) {
                fan.expenses = {
                    projects: projects.length
                };
            }
            fan.followCount = fan.fan_of_artist.length;
            //TODO As we don't have the key for that right now
            // SO has to be modified in the future
            fan.totalPlay = 0;
            delete fan._id;
            delete fan.fan_of_artist;
            reply(fan);
        }).fail(function (err) {
            if (err) {
                console.error(err.stack);
                return reply(reformatErrors(err));
            }
        });
    },

    /**
    *   @function
    *   @name Controller:fans.getArtistsDetail
    *   @description This function is used to get the detail of all the Artist
    *   that fan follow
    **/
    getArtistsDetail: function (req, reply) {
        var query = null, fan = {}, artists = {};
        // query to store slug
        query = {$or: [{slug: req.params.id}]};
        // condition to check the if we get id in response
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }

        // TODO: make this regexp work ;)
        // condition to check if we get email in request
        if (req.params.id.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/)) {
            query.$or.push({'email': req.params.id});
        }

        Q.all([

            // find the fan using id
            Q.ninvoke(Fan.findOne(query, {
                '_id' : 1,
                'fan_of_artist' : 1
            }), 'exec'),
            // get the current contest
            Q.ninvoke(Contest.findOne({
                // Condition for getting the record whose end date is greater than current date
                'cfe.time.start': {$lte: (new Date()).toISOString()},
                'finals.time.end': {$gte: (new Date()).toISOString()}
            }, {
                _id : 1,
                name : 1,
                'finals.time' : 1
            }), 'exec')
        ])
        .spread(function (_fanDetail, _contest) {
            if (!_fanDetail) {
                return reply(Hapi.error.notFound());
            }

            fan = _fanDetail;
            return Q.all([
                    // Find the detail of the artist that fan follow
                    Q.ninvoke(Artist.find({'_id' : {$in : fan.fan_of_artist}},
                    {
                        _id: 1,
                        name: 1,
                        slug: 1,
                        country: 1,
                        picture: 1,
                        credits: 1,
                        totalPlays: 1,
                        createdAt: 1,
                        fanCount: 1,
                        earnings : 1
                    }).lean().populate(
                    // Getting the detail of contest using populate
                        {
                            path: 'earnings.projects._id',
                            select: 'deleted',
                            match : {'deleted' : {$gt : new Date()}}
                        }
                    ), 'exec'),
                    // ToDo In future we add the key market place to identify is there
                    // any song of artist that is avaliable for the purchase
                    Q.ninvoke(Song.find(
                        {artist: {$in : fan.fan_of_artist},
                         state: 'active'}), 'exec'),
                    // retur the artist that participated in the contest
                    getParticipant(_contest, fan.fan_of_artist)
                ]);
        }).spread(function (_artists, _songs, artistParticipate) {
            artists = _artists;

            // iterate the artist
            artists.forEach(function (artist) {
                if (artist.earnings &&
                    artist.earnings.projects[0] &&
                    artist.earnings.projects[0]._id &&
                    artist.earnings.projects[0]._id._id) {
                    artist.isProject = 1;
                }else {
                    artist.isProject = 0;
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
            return Q.all([
                // Find the payment received by the artist's which are
                // follow by the fan
                Q.ninvoke(Payment.aggregate()
                    .match({
                        'target.artist': {
                            $in: fan.fan_of_artist
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
                            $in: fan.fan_of_artist
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

        }).spread(function (_payments, _votes) {
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

            return artists;
        }).then(function (artists) {
            // response the detail of the artist
            reply({artists : artists});
        }).fail(function (err) {
            if (err) {
                console.error(err.stack);
                return reply(reformatErrors(err));
            }
        });
    },
    /**
    *   @function
    *   @name Controller:fans.getFavoriteArtists
    *   @description This function is used to get the detail of the favorite artist
    *   i.e. The artist for which fan give a vote in past
    **/
    getFavoriteArtists : function (req, reply) {
        var sortBy = req.query.sort || 'createdAt',
            query = null;
        // query to store slug
        query = {$or: [{slug: req.params.id}]};
        var fan = {};
        // condition to check the if we get id in response
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }

        // TODO: make this regexp work ;)
        // condition to check if we get email in request
        if (req.params.id.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/)) {
            query.$or.push({'email': req.params.id});
        }

        if (req.params.id.indexOf('@') !== -1) {
            query.$or.push({'email': req.params.id});
        }
        // Find the fan using the id
        Q.ninvoke(Fan.findOne(query, '_id fan_of_artist')
            .sort(sortBy).lean(true), 'exec')
        .then(function (_fan) {
            if (!_fan || _fan === undefined) {
                return reply(Hapi.error.notFound());
            }

            fan = _fan;
            // find all the votes given by the fan
            return Q.ninvoke(Vote.find({"voter_fan" : fan._id}), 'exec');
        })
        .then(function (votes) {
            // store the artist id from the votes array
            var artistId = _.pluck(votes, 'artist');
            var artistUniqueId = [];
            // remove the duplicate id from the artistId array
            artistUniqueId = _.uniq(artistId, function (id) {
                return JSON.stringify(id);
            });
            // Find the artist for which fan has given a vote
            return Q.ninvoke(Artist.find({'_id' :
                {$in : artistUniqueId}
            }, '_id name slug picture'), 'exec');
        })
        .then(function (_artists) {
            reply({artists : _artists});
        })
        .fail(function (err) {
            if (err) {
                console.error(err.stack);
                return reply(reformatErrors(err));
            }
        });
    },
    /**
    *   @function Controller:fans.stats
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    *   @description Get stats about a defined fan
    *   @callback return object
    *   @returns {Object} stats lists
    **/
    getStats: function (req, reply) {
        Vote.aggregate([{
            $match: {
                voter_fan: mongoose.Types.ObjectId(req.params.id),
                type: {$in: ['facebook', 'twitter', 'purchase', 'bonus', 'fan']},
                status: 'processed'
            }
        }, {
            $group: {
                _id: {fan: '$voter_fan', contest: '$contest', phase: '$phase'},
                votes: {$sum: 1},
                twitter: {$sum: {$cond: [{$eq: ['$type', 'twitter']}, 1, 0]}},
                facebook: {$sum: {$cond: [{$eq: ['$type', 'facebook']}, 1, 0]}},
                purchase: {$sum: {$cond: [{$eq: ['$type', 'purchase']}, 1, 0]}},
                purchase_dollar: {$sum: {$cond: [{$eq: ['$type', 'purchase']}, 1, 0]}},
                mobile: {$sum: {$cond: [{$ne: ['$platform', 'desktop']}, 1, 0]}},
                series: {$sum: {$cond: [{$eq: ['$series_vote', true]}, 1, 0]}}
            }
        }
        ], function (err, stats) {
            if (err) {
                return reply(err);
            }
            Contest.populate(stats, [{
                path: '_id.contest',
                select: 'name',
                model: 'Contest'
            }], function (err) {
                if (err) {
                    return reply(err);
                }
                var result = stats.map(function (entry) {
                    var item = [];
                    if (entry._id.phase == 'globalfinalsBest16') {
                        item[0] = 'Best Of 16';
                    } else if (entry._id.phase == 'globalfinalsBest64') {
                        item[0] = 'Best Of 64';
                    } else if (entry._id.phase == 'globalfinalsQualification') {
                        item[0] = 'Qualification Round';
                    } else if (entry._id.phase == 'np') {
                        item[0] = 'National Preliminaries';
                    } else if (entry._id.phase == 'cfe') {
                        item[0] = 'Call for entry phase';
                    } else {
                        item[0] = entry._id.phase;
                    }
                    item[1] = entry.votes;
                    item[2] = entry.facebook;
                    item[3] = entry.twitter;
                    item[4] = (entry.purchase != undefined) ? entry.purchase : '-';
                    item[5] = (entry.series != undefined) ? entry.series : '-';
                    return item;
                });
                if (err) {
                    return reply(err);
                }
                reply(result);
            });

        });
    },
    /**
    *   @function Controller:Fans.getSongs
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    *   @description This is for fetching and returning the songs list
    *   @callback return object
    *   @returns {Object} physical product lists
    */
    getSongs: function (req, reply) {
        var query = {'userId': req.params.id, 'userType': 'fan'};
        Q.all([
            MediaLibrary.count(query).exec(),
            MediaLibrary.find(query).exec()
        ])
        .then(function (data) {
            var total = Math.ceil(data[0]);
            if (!total) {
                reply({
                    total: total,
                    results: data[1]
                });
            } else {
                var results = data[1][0].toObject();
                var songsData = [];
                var songsTotal = results.songs.length;
                results.songs.forEach(function (s, i) {
                    populateSongs(s, function (result) {
                        songsData.push(result);
                        if (i == songsTotal - 1) {
                            results.songs = songsData;
                            reply({
                                total: songsTotal,
                                results: results
                            });
                        }
                    });
                });
            }
        })
        .fail(function (err) {
            reply(err);
        });
    },
    /**
    *   @function Controller:Fans.getPhysicalProducts
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    *   @description This is for fetching and returning the products list
    *   @callback return object
    *   @returns {Object} physical product lists
    */
    getPhysicalProducts: function (req, reply) {
        //TODO: for returning the purchaed products
        reply({
            total: 0,
            results: []
        });
    },
    /**
    *   @function Controller:Fans.getAlbums
    *   @param {object} req - Request object
    *   @param {function} reply - hapi reply interface
    *   @description This is for fetching and returning the albums list
    *   @callback return object
    *   @returns {Object} physical product lists
    */
    getAlbums: function (req, reply) {
        //TODO: for returning the purchaed albums
        reply({
            total: 0,
            results: []
        });
    }
};
