'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Q = require('q'),
    timestamps = require('mongoose-timestamps'),
    slugify = require('mongoose-slugify'),
    safeUpdate = require('../lib/model-mapper').mapFields,
    emitter = require('../lib/event-emitter'),
    states = require('../public/configs/states.json'),
    genres = require('../public/configs/genres.json'),
    stateHistory = require('./state-history');

// Basic Album schema
var AlbumSchema = new Schema({

    ////// MANDATORY FIELDS //////

    title: {type: String, index: true},
    genres: Array,

    // Artist reference to artist's model is mandatory, every album should have an artist
    artist: {type: Schema.Types.ObjectId, ref: 'Artist', index: true},

    // Array of tracks ID
    tracks: [{type: Schema.Types.ObjectId, ref: 'Song'}],

    // Description of the album
    description: String,

    record_label: String,

    upc_code: String,

    // Type of album (ep or album)
    type: {type: String, enum: ['ep', 'album']},

    ////// NOT MANDATORY FIELDS //////

    // Price of the album
    price: Number,

    // Image of the album
    image: String,

    // Version 2 is for documents created starting from the 2015
    gr_doc_ver: Number, // Version 2 is for documents created starting from the 2015

    label: String,
    upcCode: String,
    publisher: String,

    // Info about song's moderation
    flagged_date: Date,
    flagged: Boolean,
    flagged_reason: String,
    stars: {type: Number, enum: [0, 1, 2, 3, 4, 5]},

    // Current State of the song (see states array)
    state: {index: true, type: String, enum: states},

    // History of states' changes
    stateHistory: [stateHistory]
});

AlbumSchema.index({artist: 1}, {unique: true});

// Slugify album's title
AlbumSchema.plugin(slugify, {
    position: "pre",
    lowercase: false,
    softdelete: true,
    index: true,
    prop: 'title',
    slugField: 'slug'
});

// Create and update timestamps fields "createdOn" and "modifiedOn"
AlbumSchema.plugin(timestamps, {
    index: true
});

// Emit an event every time state *changes to* active, inactive or deleted
AlbumSchema.path('state', {
    set: function (value) {
        if (value === 'active' || value === 'inactive' || value === 'deleted') {
            // Emit a statechange event if album's state changes
            emitter.emit('album:statechange', this, value);
        }
        return value;
    }
});

// Fields updateable from admin and from frontend users
var updatableFields = {
    profile: ['title', 'genres', 'label', 'upcCode', 'publisher', 'price', 'order'],
    admin: ['title', 'genres', 'artist', 'label', 'upcCode', 'publisher', 'price', 'order',
        'flagged', 'flagged_reason', 'flagged_date', 'state']
};

// Safely update the model (see updateableFields above)
AlbumSchema.methods.safeUpdate = function (props, type) {
    safeUpdate(this, props, updatableFields[type], AlbumSchema);
    return Q.ninvoke(this, 'save');
};

module.exports = mongoose.model('Album', AlbumSchema);