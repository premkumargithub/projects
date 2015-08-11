'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../../config'),
    uuid = require('node-uuid'),
    Q = require('q');

var ArtistPaypalCheckSchema = new Schema({
    artistId: {
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    },

    verified: {
        type: Boolean,
        default: false
    },
    name: String,
    email: String,
    user_email: String,
    firstname: String,
    lastname: String,
    currencies: [String],

    check_timestamp: {
        type: Date,
        default: new Date()
    },
    usedContactEmail: Boolean,
    usedContactData: Boolean
});

module.exports = mongoose.model('ArtistPaypalCheck', ArtistPaypalCheckSchema);
