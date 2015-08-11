'use strict';

/**
 * @module Models:badge
 *
 * @description Model representing badges collection on MongoDB
 *
 * @requires module:mongoose
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// Badge schema. Refers to Contest schema.
var Badge = new Schema({
    contest: {
        type: Schema.Types.ObjectId,
        ref: 'Contest'
    },
    userId: Schema.Types.ObjectId,
    userType: {
        type: String,
        enum: ['fan', 'artist']
    },
    type: {
        type: String,
        enum: [
            'bestof16', 'bestof64', 'globalrockstar', 'votingserie', 'wildcard', 'nationalwinner', 'votingserie-voted'
        ]
    }
});

Badge.index({userId: 1, userType: 1});
Badge.index({userId: 1, userType: 1, contest: 1, type: 1}, {unique: true});

module.exports = mongoose.model('Badge', Badge);
