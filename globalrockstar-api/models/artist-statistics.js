'use strict';

/**
 * @module Models:artist-statistics
 *
 * @description Model representing artiststatistics collection on MongoDB, intended to combines all stats for one artist
 *
 * @requires module:mongoose
 * @requires module:q
 * @requires module:mongoose-timestamps
 */
var mongoose = require('mongoose'),
    Q = require('q'),
    Schema = mongoose.Schema;

// ArtistStatistics schema. Refers to Contest schema.
var ArtistStatistics = new Schema({
    artistId: {
        type: Schema.Types.ObjectId,
        index: true
    },
    artistSlug: {
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
    earnings: {
        amount: Number,
        currency: String
    }
});

// Add statistics
// FIXME: This method seems to be not used anymore
ArtistStatistics.statics.add = function (opts) {
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
        artistId: opts.artistId,
        'contest.id': opts.contestId,
        'contest.phase': opts.contestPhase
    }, {
        $inc: obj
    }, {
        upsert: true
    }).fail(console.error);
};

ArtistStatistics.plugin(require('mongoose-timestamps'));

module.exports = mongoose.model('ArtistStatistics', ArtistStatistics);
