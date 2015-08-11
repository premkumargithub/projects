'use strict';
/**
 *@module Controller:Vouchers
 *@description this modulle is used for vouchers activities
 *Required modules are defined here
 *@requires module:hapi
 *@requires module:../lib/mongoose-hapi-errors
 *@requires module:../models/voucher
 *@requires module:../models/voucher-template
 *@requires module:../models/payment
 *@requires module:lodash
 *@requires module:mongoose
 *@requires module:csv-stringify
 **/
var Hapi = require('hapi');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var Q = require('q');
var Voucher = require('../models/voucher');
var VoucherTemplate = require('../models/voucher-template');
var Payment = require('../models/payment');
var lodash = require('lodash');
var mongoose = require('mongoose');
var csvStringify = require('csv-stringify');

/** @namespace */
var success = {
    /**
     * Refer to this by {@link success."status"}.
     * @namespace
     */
    status: 'success'
};

/**
 * @name Controller:Vouchers.add
 * @function
 * @param {integer} a Numeric value
 * @param {integer} b Numeric value
 * @param {String} lasttname User last name
 * @description This is used for adding two values
 * @returns {integer}
 */
var add = function (a, b) {
    return a + b;
};

module.exports = {
    /**
     * @name Controller:Vouchers.users
     * @function
     * @param {object} role - Request object
     * @description It contains many events corresponding to users
     **/
    users: function (role) {
        return {
            /**
             * @name Controller:Vouchers.users-index
             * @function
             * @param {object} req - Request object
             * @param {interface} reply - hapi reply interface
             * @description It retrieves the data from Voucher model
             * then populate artist and contest then reply
             **/
            index: function (req, reply) {
                Voucher.find({
                    'user.id': req.params.userId,
                    status: 'processed'
                }).populate('artist', {
                    name: 1,
                    slug: 1,
                    picture: 1
                }).populate('contest', {
                    name: 1
                }).exec(function (err, voucher) {
                    if (err) {
                        return reply(err);
                    }
                    reply(voucher);
                });
            },
            /**
             * @name Controller:Vouchers.users-create
             * @function
             * @param {object} req - Request object
             * @param {interface} reply - hapi reply interface
             * @description It checks either Voucher template found or not
             * OR prepare the voucher object and save to the Voucher model
             **/
            create: function (req, reply) {
                if (!req.pre.template) {
                    console.error('Voucher template not found');
                    return reply(Hapi.error.internal('template id not found'));
                }

                var template = req.pre.template;

                console.log("VOUCHER TEMPLATE =>>> ");
                console.log(JSON.stringify(template, null, 2));
                var voucher = new Voucher({
                    user: {
                        id: req.pre.user._id,
                        role: role
                    },
                    amount: template.toObject().amount,
                    votes: template.votes,
                    template: template._id,
                    title: template.title,
                    artist: req.params.artistId
                });

                console.log('users:vouchers:add:' + JSON.stringify(req.payload));
                voucher.save(function (err, obj) {
                    if (!err) {
                        reply(obj);
                    } else {
                        console.error(err);
                        return reply(reformatErrors(err));
                    }
                });
            },
            /**
             * @name Controller:Vouchers.users-activate
             * @function
             * @param {object} req - Request object
             * @param {interface} reply - hapi reply interface
             * @description It checks type(Object) Voucher
             * then save the voucher object and save to the Voucher model
             **/
            activate: function (req, reply) {
                var user = req.pre.user;
                var voucher = req.pre.voucher;
                if (!voucher) {
                    return reply(Hapi.error.notFound());
                }
                //TODO: fix this problem when it will be safe to do it
                /* jshint -W018 */
                if (!voucher.user.id.toString() === user._id.toString()) {
                    return reply(Hapi.error.notFound());
                }
                /* jshint +W018 */

                voucher.status = 'processed';
                voucher.save(function (err) {
                    if (err) {
                        console.error(err);
                        return reply(err);
                    }
                    console.log('users:vouchers:activated:' + voucher._id);

                    reply(success);
                });
            },
            /**
             * @name Controller:Vouchers.users-active
             * @function
             * @param {object} req - Request object
             * @param {interface} reply - hapi reply interface
             * @description It fetchs the active voucher (Object)
             * based on the userId and artistId
             **/
            active: function (req, reply) {
                Voucher.findActive(req.params.userId, role, req.params.artistId)
                    .then(reply)
                    .fail(function (err) {
                        console.error(err);
                        reply(err);
                    });
            },
            /**
             * @name Controller:Vouchers.users-hasActive
             * @function
             * @param {object} req - Request object
             * @param {interface} reply - hapi reply interface
             * @description It fetch the active voucher (Object)
             * based on the userId and artistId
             **/
            hasActive: function (req, reply) {
                Voucher.findActive(req.params.userId, role, req.params.artistId)
                    .then(function (vouchers) {
                        var count = vouchers.map(lodash.property('votesLeft')).reduce(add, 0);

                        reply({
                            votesLeft: count,
                            canUseVoucher: count > 0,
                            artist: req.params.artistId
                        });
                    }).fail(function (err) {
                        console.error(err);
                        reply(err);
                    });
            },
            /**
             * @name Controller:Vouchers.users-use
             * @function
             * @param {object} req - Request object
             * @param {interface} reply - hapi reply interface
             * @description It fetch the active voucher (Object)
             * based on the userId and artistId
             **/
            use: function (req, reply) {
                var voucher;
                Voucher.findActive(req.params.userId, role, req.params.artistId)
                    .then(function (vouchers) {
                        if (!voucher.length) {
                            return Q.reject(Hapi.error.expectationFailed('no votes on vouchers left'));
                        }
                        voucher = vouchers[0];
                        voucher.votesLeft -= 1;
                        return Q.ninvoke(voucher, 'save');
                    }).then(function () {
                        reply(voucher);
                    }).fail(function (err) {
                        console.error(err);
                        reply(err);
                    });
            }
        };
    },
    /**
     * @name Controller:Vouchers.admins
     * @function
     * @description It contains many events for admin use
     **/
    admins: {
        /**
         * @name Controller:Vouchers.admins-active
         * @function
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description It used to active the voucher template
         **/
        active: function (req, reply) {
            Q.ninvoke(VoucherTemplate.find({
                active: true
            }).sort({
                'amount.USD': 1
            }), 'exec')
                .then(function (vouchers) {
                    reply(vouchers);
                }).fail(function (err) {
                    reply(err);
                });
        },
        /**
         * @name Controller:Vouchers.admins-create
         * @function
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description It instantiate VoucherTemplate
         **/
        create: function (req, reply) {
            console.dir(req.payload);
            var voucher = new VoucherTemplate(req.payload);
            Q.ninvoke(voucher, 'save').then(function () {
                reply(success);
            }).fail(function (err) {
                console.dir(err);
                return reply(reformatErrors(err));
            });
        },
        /**
         * @name Controller:Vouchers.admins-show
         * @function
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description It filter the voucher and
         * @returns {object} voucher
         **/
        show: function (req, reply) {
            reply(req.pre.voucher);
        },
        /**
         * @name Controller:Vouchers.admins-activate
         * @function
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description It activate the voucher
         * @returns {object} success or error
         **/
        activate: function (req, reply) {
            req.pre.voucher.active = true;
            Q.ninvoke(req.pre.voucher, 'save')
                .then(function () {
                    reply(success);
                }).fail(function (err) {
                    reply(err);
                });
        },
        /**
         * @name Controller:Vouchers.admins-deactivate
         * @function
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description It deactivate the voucher
         * @returns {object} success or error
         **/
        deactivate: function (req, reply) {
            req.pre.voucher.active = false;
            Q.ninvoke(req.pre.voucher, 'save')
                .then(function () {
                    console.log('voucher:deactivate:' + req.params.id);
                    reply(success);
                }).fail(function (err) {
                    console.error(err);
                    reply(err);
                });

        }
    },
    /**
     * @name Controller:Vouchers.artists
     * @function
     * @description It contains many events for admin artists
     **/
    artists: {
        /**
         * @name Controller:Vouchers.artists-artistsusedVouchers
         * @function
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description It deactivate the voucher
         * @returns {object} success or error
         **/
        usedVouchers: function (req, reply) {
            Q.ninvoke(Voucher.find({
                artist: req.params.userId,
                status: 'processed',
                contest: req.params.contestId
            }).populate('userFan userArtist', {
                email: 1,
                slug: 1,
                name: 1,
                firstname: 1,
                lastname: 1
            }), 'exec').then(function (vouchers) {
                reply(csvStringify(vouchers.map(function (v) {
                    var user = v.userArtist || v.userFan;
                    return {
                        name: user.name || user.firstname + ' ' + user.lastname,
                        email: user.email,
                        package: v.title
                    };
                }))).header('Content-disposition', 'attachment; filename=user-packages.csv')
                    .type('text/csv')
                    .charset('UTF-8');
            }).fail(function (err) {
                console.error(err);
                console.error(err.stack);
                reply(err);
            });

        },
        /**
         * @name Controller:Vouchers.artists-usedVouchersCount
         * @function
         * @param {object} req - Request object
         * @param {interface} reply - hapi reply interface
         * @description It retrieves contests data
         * @returns {object} success
         **/
        usedVouchersCount: function (req, reply) {
            Q.ninvoke(Voucher, 'aggregate', [{
                $match: {
                    artist: new mongoose.Types.ObjectId(req.params.userId),
                    status: 'processed'
                }
            }, {
                $group: {
                    _id: '$usedUp.contest',
                    total: {
                        $sum: 1
                    }
                }
            }]).then(function (contests) {
                reply(contests);
            }).fail(function (err) {
                console.error(err);
                console.error(err.stack);
                reply(err);
            });
        }
    }
};
