'use strict';

/**
 * @module Models:chart_entry
 *
 * @description Model representing chartentries collection on MongoDB
 *
 * @requires module:mongoose
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// ChartEntry schema. Refers to Contest, Song, Artist and Vote schema.
var ChartEntry = new Schema({
    phase: {
        type: String,
        index: true
    },
    votes: {
        type: Number,
        index: true,
        default: 0
    },
    country: String,
    contest: {
        type: Schema.Types.ObjectId,
        ref: 'Contest'
    },
    song: {
        type: Schema.Types.ObjectId,
        ref: 'Song'
    },
    artist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
        index: true
    },
    pos: {
        type: Number,
        default: 0
    },
    voteRefs: [{
        type: Schema.Types.ObjectId,
        ref: 'Vote'
    }],
    voteTypes: {
        ios: {
            type: Number,
            default: 0
        },
        android: {
            type: Number,
            default: 0
        },
        serie: {
            type: Number,
            default: 0
        },
        fan: {
            type: Number,
            default: 0
        },
        facebook: {
            type: Number,
            default: 0
        },
        twitter: {
            type: Number,
            default: 0
        },
        desktop: {
            type: Number,
            default: 0
        },
        purchase: {
            type: Number,
            default: 0
        },
        dummy: {
            type: Number,
            default: 0
        },
        bonus: {
            type: Number,
            default: 0
        },
        wildcard: {
            type: Number,
            default: 0
        }

    },
    nPos: {
        type: Number,
        default: 0
    },
    wildcard: {
        position: Number,
        anouncement: Date
    },
    createdAt: {
        type: Date,
        default: function () {
            return new Date();
        }
    },
    postNominated: {
        type: Boolean,
        default: false
    },
    postNominated2: {
        type: Boolean,
        default: false
    },
    postNominated3: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ChartEntry', ChartEntry);
