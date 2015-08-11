'use strict';
/**
 *   @module Model:Voucher
 *   @description This module is used for providing database interation to voucher model
 *   @requires module:lodash
 *   @requires module:mongoose
 *   @requires module:moment
 *   @requires module:q
 *   @requires module:hapi
 *   @requires module:../lib/get-current-contest
 *   @requires module:../lib/model-mapper
 *   @requires module:../public/configs/currencies
 **/
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var Q = require('q');
var lodash = require('lodash');
var Hapi = require('hapi');
var currentContest = require('../lib/get-current-contest');
var mapFields = require('../lib/model-mapper').mapFields;
var currencies = require('../public/configs/currencies');

var amountSchema = {};
_.map(currencies, function (c) {
    amountSchema[c.code] = {
        type: Number,
        required: true,
        default: -1
    };
});

/**
 * @function Model:Voucher.add
 * @param {integer} a Numeric value
 * @param {integer} b Numeric value
 * @param {String} lasttname User last name
 * @description This is used for adding two values
 * @returns {integer}
 */
var add = function (a, b) {
    return a + b;
};

/**
 * @namespace
 * @name Model:Voucher.Voucher
 * @desc Create the schema for Voucher table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var Voucher = new Schema({
    template: {
        type: Schema.Types.ObjectId
    },
    artist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
        index: true
    },
    contest: {
        type: Schema.Types.ObjectId,
        ref: 'Contest'
    },
    title: {
        type: String,
        required: true
    },
    amount: amountSchema,
    votes: {
        type: Number,
        required: true
    },
    votesLeft: {
        type: Number
    },
    createdAt: {
        type: Date
    },
    expiresAt: {
        type: Date,
        index: true
    },
    user: {
        id: {
            type: Schema.Types.ObjectId,
            required: true
        },
        role: {
            type: String,
            enum: ['fan', 'artist'],
            required: true
        }
    },
    userFan: {
        type: Schema.Types.ObjectId,
        ref: 'Fan'
    },
    userArtist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    },
    status: {
        type: String,
        enum: ['pending', 'processed'],
        default: 'pending'
    },
    usedUp: {
        at: Date,
        contest: Schema.Types.ObjectId
    }
});

/**
 * @name Model:Voucher.Voucher-pre
 * @event
 * @param {object} next - Next event object
 * @description Used to check either request event is next or not on save voucher
 * then prepare the voucher object to save in the Db
 * and return based on the output
 * @return {object} next event Pass the control to next step
 *
 */
Voucher.pre('save', function (next) {
    if (!this.isNew) {
        return next();
    }

    this.votesLeft = this.votes;
    this.createdAt = new Date();
    this.expiresAt = moment().add(2, 'years');

    if (this.user.role == 'fan') {
        this.userFan = this.user.id;
    } else {
        this.userArtist = this.user.id;
    }

    var self = this;

    currentContest()
        .then(function (contest) {
            self.contest = contest._id;
            next();
        }).fail(function (err) {
            console.error(err);
            console.error(err.stack);
            next();
        });
});

Voucher.pre('save', function (next) {
    if (this.votesLeft !== 0) {
        return next();
    }
    if (this.usedUpAt) {
        return next();
    }

    var self = this;

    currentContest().then(function (contest) {
        self.usedUp = {
            at: new Date(),
            contest: contest._id
        };
        next();
    }).fail(function (err) {
        console.error('voucher:save:%s:can-not-complete-because-of-missing-contest', self._id);
        console.error(err);
        next();
    });
});

/**
 * @name Model:Voucher.Voucher-statics-findActive
 * @event
 * @param {objectId} user - User Id
 * @param {string} role - User role type
 * @param {string} artist - User role type
 * @description Used to check either request event is next or not on save voucher
 * then prepare the voucher object to save in the Db
 * and return based on the output
 * @return {object} next event Pass the control to next step
 *
 */
Voucher.statics.findActive = function (user, role, artist) {
    var query = {
        'user.id': user,
        'user.role': role,
        expiresAt: {
            $gt: new Date()
        },
        votesLeft: {
            $gt: 0
        },
        status: "processed"
    };

    if (artist) {
        query.$or = [{
            artist: artist
        }, {
            artist: {
                $not: {
                    $exists: 1
                }
            }
        }];
    }

    return Q.ninvoke(this.find(query).sort({
        expiresAt: 1
    }), 'exec');
};

/**
 * @name Model:Voucher.Voucher-statics-use
 * @event
 * @param {objectId} user - User Id
 * @param {string} role - User role type
 * @param {string} artist - User role type
 * @description Used to retrieve the user's which are actibe and with artist type
 * @return {object} voucher objects
 *
 */
Voucher.statics.use = function (user, role, artist) {
    var vouchers;
    return this.findActive(user, role, artist).then(function (_vouchers) {
        vouchers = _vouchers;
        if (!vouchers.length) {
            return Q.reject(Hapi.error.expectationFailed('no votes on vouchers left'));
        }
        var voucher = vouchers[0];
        voucher.votesLeft -= 1;
        console.log('vouchers:used:' + voucher._id);
        return Q.ninvoke(voucher, 'save');
    }).then(function () {
        return {
            votesLeft: vouchers.map(lodash.property('votesLeft')).reduce(add, 0)
        };
    });
};

module.exports = mongoose.model('Voucher', Voucher);
