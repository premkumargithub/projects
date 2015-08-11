'use strict';

/**
 * @module Models:chart_entry
 *
 * @description Model representing contents collection on MongoDB
 *
 * @requires module:mongoose
 * @requires module:mongoose-timestamps
 * @requires module:mongoose-slugify
 */
var mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamps'),
    slugify = require('mongoose-slugify'),
    Schema = mongoose.Schema;

// Content schema.
var Content = new Schema({
    title: {
        type: String,
        required: true
    },
    layout: {
        type: String
    },
    text: {
        type: String,
        required: true
    },
    state: {
        type: String,
        enum: ['active', 'deleted']
    },
    description: {
        type: String
    }
});

// Set virtual attribute not persisted on MongoDB
Content.virtual('attrAccessible').get(function () {
    return ['description', 'title', 'text', 'state', 'layout'];
});

// Add slugify plugin
Content.plugin(slugify, {
        position: 'pre',
        lowercase: false,
        softdelete: false,
        index: true,
        prop: 'title',
        slugField: 'slug'
    }
);

// Add timestamp plugin
Content.plugin(timestamps, {index: true});

module.exports = mongoose.model('Content', Content);
