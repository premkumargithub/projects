'use strict';
/**
 * @module Models:frontend-admin
 *
 * @description Model representing frontendadmins collection on MongoDB
 *
 * @requires module:mongoose
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// FrontendAdmin schema.
var FrontendAdmin = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['fan', 'artist']
    }
});

// Add secondary indexes for high performance read operations on these fields
FrontendAdmin.index({userId: 1, userType: 1});

module.exports = mongoose.model('FrontendAdmin', FrontendAdmin);
