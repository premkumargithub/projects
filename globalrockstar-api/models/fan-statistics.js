'use strict';

/**
 * @module Models:fan-statistics
 *
 * @description Model representing fanstatistics collection on MongoDB, intended to combines all stats for one fan
 *
 * @requires module:mongoose
 * @requires module:q
 * @requires module:mongoose-timestamps
 */
var mongoose = require('mongoose'),
    Q = require('q'),
    Schema = mongoose.Schema;

// FanStatistics schema. Refers to Contest schema.
var FanStatistics = new Schema({
    fanId: {
        type: Schema.Types.ObjectId
    },
    fanType: String,
    fanSlug: {
        type: String
    },
    contest: {
        id: {
            type: Schema.Types.ObjectId,
            ref: "Contest"
        },
        phase: String
    },
    rank: Number,
    votes: {
        total: Number,
        twitter: Number,
        facebook: Number,
        purchase: Number,
        mobile: Number,
        //wildcard + series
        extra: {
            total: Number,
            wildcard: Number,
            series: Number
        }
    },
    expenses: {
        amount: Number,
        currency: String
    }
});

// Add secondary indexes for high performance read operations on these fields
FanStatistics.index({fanId: 1, fanType: 1});

// Add statistics
// FIXME: This method seems to be not used anymore
FanStatistics.statics.add = function (opts) {
    opts.amount = opts.amount || 1;

    var obj = {};
    obj[opts.prop] = opts.amount;

    if (['twitter', 'facebook', 'purchase'].indexOf(opts.prop.replace('votes.', '')) !== -1) {
        obj['votes.total'] = opts.amount;
    }

    if (['wildcard', 'series'].indexOf(opts.prop.replace('votes.extra.', '')) !== -1) {
        obj['votes.total'] = opts.amount;
        obj['votes.extra.total'] = opts.amount;
    }

    if (opts.platform != 'desktop') {
        obj['votes.mobile'] = opts.amount;
    }

    return Q.ninvoke(this, 'update', {
        fanId: opts.fanId,
        fanType: opts.fanType,
        'contest.id': opts.contestId,
        'contest.phase': opts.contestPhase
    }, {
        $inc: obj
    }, {
        upsert: true
    }).fail(console.error);
};

FanStatistics.plugin(require('mongoose-timestamps'));

module.exports = mongoose.model('FanStatistics', FanStatistics);
