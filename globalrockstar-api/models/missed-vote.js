"use strict";
/**
 * @module Models:missed-vote
 *
 * @description Model representing missedvotes collection on MongoDB
 *
 * @requires module:mongoose
 * @requires module:mongoose-timestamps
 */
var mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamps'),
    Schema = mongoose.Schema;

// MissedVote schema. Refers to Song schema
var MissedVote = new Schema({
    artist: {
        type: String,
        index: true
    },

    voter_id: {
        type: String,
        index: true
    },

    voter_type: {
        type: String,
        index: true
    }
});

// Add timestamps plugin
MissedVote.plugin(timestamps, {index: true});
module.exports = mongoose.model('MissedVote', MissedVote);
