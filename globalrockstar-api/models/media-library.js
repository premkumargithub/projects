'use strict';
/**
 * @module Models:media-library
 *
 * @description Model representing medialibraries collection on MongoDB
 *
 * @requires module:mongoose
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// MediaLibrary schema. Refers to Song schema
var MediaLibrary = new Schema({
    userId: Schema.Types.ObjectId,
    userType: {
        type: String,
        enum: ['fan', 'artist']
    },
    songs: [{
        type: Schema.Types.ObjectId,
        ref: 'Song'
    }]
});

// Add secondary indexes for high performance read operations on these fields
MediaLibrary.index({
    'userId': 1,
    'userType': 1
}, {
    unique: true
});

module.exports = mongoose.model('MediaLibrary', MediaLibrary);
