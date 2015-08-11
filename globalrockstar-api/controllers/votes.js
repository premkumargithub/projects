'use strict';
/**
 *@module Controller:votes
 *@description this modulle is used for Votes activities
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:Vote
 *@requires module:Payment
 *@requires module:Voucher
 *@requires module:hapi
 *@requires module:q
 *@requires module:../lib/mongoose-hapi-errors
 **/
var mongoose = require('mongoose');
var Vote = mongoose.model('Vote');
var Payment = mongoose.model('Payment');
var Voucher = mongoose.model('Voucher');
var Hapi = require('hapi');
var Q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var reformatErrors = require('../lib/mongoose-hapi-errors');
var request = require('request');
var config = require('../config');

/**
 * @function Controller:votes.isDuplicateKeyError
 * @param {object} err Error object
 * @description This function is used for checking either the key is duplicate key
 * @returns {integer}
 */
function isDuplicateKeyError(err) {
    return err.message.indexOf('duplicate key') != -1;
}

/**
 * @function Controller:votes.createDuplicateKeyError
 * @param {object} err Error object
 * @param {object} oldVote old vote object
 * @description This function is used for creating duplicate key error
 * @returns {object} Error
 */
function createDuplicateKeyError(err, oldVote) {
    var error = Hapi.error.conflict(oldVote._id);
    error.output.payload.data = {
        voteId: oldVote._id,
        oldVote: oldVote
    };

    return error;
}

/**
 * @function Controller:votes.today
 * @param none
 * @description This function is used for calculating the today's date with time 00:00:00
 * @returns {object} Date object
 */
function today() {
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

/**
 * @function Controller:votes.createMobilePayment
 * @param {object} vote
 * @description This function is used for calculating the today's date with time 00:00:00
 * @returns {object} Date object
 */
function createMobilePayment(vote) {
    console.log('vote:create-mobile-payment');
    Payment.createFromMobileVote(vote._id).fail(function (err) {
        console.error(err);
        console.error(err.stack);
    });
}

/**
 * @function Controller:votes.getNotice
 * @param {object} o
 * @description It checks vouchersCount, vouchers.votesLeft and votesInSerie
 * @returns {String} type based string
 */
function getNotice(o) {
    if (o.vouchersCount && o.vouchers && o.vouchers.votesLeft == 3) {
        return 'only-3-votes-left';
    }
    if (o.vouchersCount) {
        return null;
    }
    if (o.purchasesCount == 1 && o.isPurchase) {
        return 'first-purchase';
    }
    if (o.purchasesCount == 5 && o.isPurchase) {
        return 'fifth-purchase';
    }
    if (o.votesInSerie == 2) {
        return 'second-series-vote';
    }
}

/**
 * @function Controller:votes.getMatchFor
 * @param {String} user
 * @param {String} role
 * @returns {object}
 */
function getMatchFor(user, role) {
    return Q.ninvoke(request, 'get', config.arena + '/match/' + role + 's/' + user);
}

/**
 * @function Controller:votes.createDummyVote
 * @param {Object} vote
 * @param {Object} match
 * @returns {object}
 */
function createDummyVote(vote, match) {
    var other;
    if (vote.song == match.artist1.song.songId) {
        other = 'artist2';
    }
    if (vote.song == match.artist2.song.songId) {
        other = 'artist1';
    }
    if (!other) {
        return;
    }

    var dummy = new Vote({
        type: 'dummy',
        status: 'dummy',
        platform: vote.platform,
        voter_fan: vote.voter_fan,
        voter_artist: vote.voter_artist,
        day: vote.day,
        contest: vote.contest,
        phase: vote.phase,
        artist: match[other].artistId,
        song: match[other].song.songId
    });
    dummy.save(function (err) {
        console.log('vote:dummy:saved:%s', dummy._id);
        if (err) {
            console.error(err.stack);
        }
    });
}

module.exports = {
    /**
     * @name Controller:votes.index
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It prepares the query and retrieves the data from Vote model
     * @returns {object} Votes object
     **/
    index: function (req, reply) {
        if (req.params.id) {

            Vote.findOne({
                _id: req.params.id
            }, function (err, votes) {
                if (err) {
                    return reply(reformatErrors(err));
                }
                if (!votes) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(votes);
                }
            });
        } else {
            var query = req.pre.search || {};
            if (query.$and && query.$and[0].day) {
                query.$and[0].day = new Date(Date.parse(query.$and[0].day));
            }

            var find = Vote.find(query).sort(req.query.sort || "-day");

            if (req.query.populate) {
                find = find.populate(req.query.populate);
            }
            if (req.query.limit) {
                find = find.limit(req.query.limit);
            }

            if (req.query.fields) {
                find = find.select(req.query.fields.replace(",", " "));
            }

            find.exec(function (err, votes) {
                console.log(err);
                if (err) {
                    return reply(err);
                }
                reply(votes);
            });

        }
    },
    /**
     * @name Controller:votes.create
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It checks isVoucher
     * @returns {object} object
     **/
    create: function (req, reply) {
        var data = req.payload;
        var user = data.voter_fan || data.voter_artist;
        var role = data.voter_fan ? 'fan' : 'artist';
        var artist = data.artist;
        var isVoucher = req.payload.type == 'voucher';
        var vouchers;
        var dfd;
        var vote;
        var oldVote;
        var arenaMatch;
        var vouchersCount;
        var purchasesCount;
        var endpoints = [];

        if (isVoucher) {
            req.payload.type = 'purchase';
        }

        endpoints.push(Q.ninvoke(Vote, 'findOne', {
            voter_artist: req.payload.voter_artist,
            voter_fan: req.payload.voter_fan,
            type: req.payload.type,
            day: today(),
            song: req.payload.song
        }));

        if (req.payload.platform == 'desktop') {
            endpoints.push(Q.resolve(false));
        } else {
            endpoints.push(getMatchFor(user, role));
        }

        if (isVoucher) {
            endpoints.push(Voucher.findActive(user, role, artist));
        } else {
            endpoints.push(Q.resolve(false));
        }


        if (req.payload.type == 'purchase') {
            endpoints.push(Q.ninvoke(Vote, 'count', {
                type: 'purchase',
                status: 'processed',
                voter_artist: req.payload.voter_artist,
                voter_fan: req.payload.voter_fan
            }));
            endpoints.push(Q.ninvoke(Voucher, 'count', {
                status: 'processed',
                'user.id': req.payload.voter_fan || req.payload.voter_artist
            }));
        }

        console.log('vote:new');
        Q.all(endpoints).spread(function (_oldVote, _arenaMatch, vouchers, _purchasesCount, _vouchersCount) {
            try {
                if (_arenaMatch) {
                    arenaMatch = JSON.parse(_arenaMatch[1]);
                }
            } catch (e) {
            }
            oldVote = _oldVote;
            if (oldVote && oldVote.processed) {
                console.log('vote:new:oldvote:exists');
                return Q.reject(new Error('duplicate key'));
            }

            vouchersCount = _vouchersCount;
            purchasesCount = _purchasesCount + (req.payload.type == 'purchase' ? 1 : 0);
            if (isVoucher && !vouchers.length) {
                console.warn('vote:vouchers:none-left');
                return Q.reject(Hapi.error.expectationFailed('no vouchers left for this artist'));
            }

            if (isVoucher) {
                console.log('vote:voucher');
                req.payload.voucher = vouchers[0]._id;
            }

            vote = new Vote(req.payload);
            var dfd = Q.defer();
            vote.save(function (err) {
                console.error(err);
                console.log('vote:new:saved');
                if (!err) {
                    return dfd.resolve(vote);
                }
                // if we have a conflict and we have a voucher or mobile purchase
                // we can delete the old vote and resave
                if (vote.type != 'purchase') {
                    return dfd.reject(err);
                }
                if (vote.platform == 'desktop' && (new Date) - oldVote.createdAt < 20e3) {
                    return dfd.reject(err);
                }
                if (!isDuplicateKeyError(err)) {
                    return Q.reject(err);
                }

                console.log('vote:vote-conflict:removing-old-vote:' + oldVote._id);
                if (oldVote.status === 'processed') {
                    return dfd.reject(Hapi.error.badRequest('already voted'));
                }
                Q.ninvoke(oldVote, 'remove').then(function () {
                    return Q.ninvoke(vote, 'save');
                }).then(function () {
                    dfd.resolve(vote);
                }).fail(function (err) {
                    dfd.reject(err);
                });
            });
            return dfd.promise;
        }).then(function () {
            if (arenaMatch) {
                createDummyVote(vote, arenaMatch);
            }
            if (!isVoucher) {
                return Q.resolve(vote);
            }

            console.log('vote:voucher:use:' + vote._id);
            return Voucher.use(user, role, artist);
        }).then(function (_vouchers) {
            vouchers = _vouchers;
            console.log('vote:checkserie:' + vote._id);
            return Vote.checkForVotingSerie(vote);
        }).then(function (votesInSerie) {
            if (votesInSerie === 3) {
                Vote.createSerie(vote);
            }
            var obj = {
                _id: vote.id,
                status: 'success',
                purchasesCount: purchasesCount,
                vouchersCount: vouchersCount,
                notice: getNotice({
                    purchasesCount: purchasesCount,
                    vouchersCount: vouchersCount,
                    votesInSerie: votesInSerie,
                    vouchers: vouchers,
                    isPurchase: req.payload.type == 'purchase'
                })
            };

            if (isVoucher) {
                obj.votesLeft = vouchers.votesLeft;
            }

            if (vote.type == 'purchase' && vote.status == 'processed') {
                obj.isSerie = votesInSerie === 3;
                obj.votesInSerie = votesInSerie;
            }

            reply(obj);

            if (vote.platform !== 'desktop' && vote.type == 'purchase') {
                createMobilePayment(vote);
            }
            console.log('vote:done:' + vote._id);
        }).fail(function (err) {
            console.error('vote:new:fail');
            console.error(err);
            console.error(err.stack);
            if (isDuplicateKeyError(err)) {
                return reply(createDuplicateKeyError(err, oldVote));
            }
            return reply(reformatErrors(err));
        }).fail(console.error);
    },
    /**
     * @name Controller:votes.show
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It retrives the vote result based on the vote ID
     * @returns {object} object
     **/
    show: function (req, reply) {
        Vote.findOne({
            _id: req.params.id
        }, function (err, votes) {
            if (err) {
                return reply(reformatErrors(err));
            }
            if (!votes) {
                reply(Hapi.error.notFound());
            } else {
                reply(votes);
            }
        });
    },
    /**
     * @name Controller:votes.update
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It update the vote result based on updated vote object
     * @returns {object} object
     **/
    update: function (req, reply) {
        var vote;
        Q.ninvoke(Vote, 'findOne', {
            _id: req.params.id
        }).then(function (_vote) {
            vote = _vote;
            if (!vote) {
                reply(Hapi.error.notFound());
                return;
            }

            return Q.ninvoke(Vote, 'count', {
                type: 'purchase',
                status: 'processed',
                voter_artist: vote.voter_artist,
                voter_fan: vote.voter_fan
            });

        }).then(function (purchasesCount) {
            console.log('vote:updating:%s', vote._id);
            Vote.checkForVotingSerie(vote).then(function (votesInSerie) {
                if (votesInSerie === 3) {
                    Vote.createSerie(vote);
                }
                var obj = {
                    _id: vote.id
                };

                if (vote.type == 'purchase' && vote.status == 'processed') {
                    obj.isSerie = votesInSerie === 3;
                    obj.votesInSerie = votesInSerie;
                }
                obj.notice = getNotice({
                    purchasesCount: purchasesCount,
                    votesInSerie: votesInSerie,
                    isPurchase: true
                });

                reply(obj);
            }).fail(function (err) {
                console.error(err);
                console.error(err.stack);
                reply(err);
            });
        }).fail(function (err) {
            console.error(err);
            console.error(err.stack);
            reply(err);
        });
    },
    /**
     * @name Controller:votes.delete
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It deletes the vote record based on vote ID
     * @returns {object} object
     **/
    delete: function (req, reply) {
        Vote.findOne({
            _id: req.params.id
        }, function (err, vote) {
            if (err) {
                reply(Hapi.error.notFound());
            }

            vote.remove(function (err, vote) {
                if (err) {
                    reply(Hapi.error.internal('internal', err));
                }
                reply('');
            });

        });
    }
};
