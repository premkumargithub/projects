'use strict';
/**
*   @module Model:Project
*   @description This module is used for providing database interation and schema management to Project model
*   @requires module:mongoose
*   @requires module:mongoose-timestamps
**/
var mongoose = require('mongoose');
var _ = require('lodash');
var currencies = require('../public/configs/currencies');
var Schema = mongoose.Schema;
var slugify = require('./plugins/project-slugify');
var timestamps = require('mongoose-timestamps');
var Artist = require('./artist');
var Q = require('q');
var youtubeUrlValidator = require('../lib/youtube-validate');

/**
*   @namespace
*   @name Model:Project.ProjectSchema
*   @desc Create the schema for Project table in mongo DB
*   @prop Schema {object} - Create the schema for the mongoose db
**/
var ProjectSchema = new Schema({
    category: {
        type: String,
        enum: ['music-production', 'tour-support', 'video-production'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    teaserImage: {
        type: String
    },
    teaserVideo: {
        type: String
    },
    moneyToRaise: {
        type: Number,
        min: 500,
        max: 30000,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    releaseDate: Date,
    rewards: [String],
    artist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    },
    state: {
        type: String,
        enum: ['created', 'publish-pending', 'published', 'expired', 'completed'],
        required: true,
        default: 'created'
    },
    denyPublishReason: String,
    deleted: Date,
    featured: {
        type: Boolean,
        default: false,
        required: true
    },

    // Fields for easy search
    _country: {
        type: String,
        index: true
    }
});

/**
*   @name model:project.slugify
*   @desc Set the validation of the key of slugify plugin
*   @prop ProjectSchema:slugify {plugin} - set slugify key validations
**/
ProjectSchema.plugin(slugify, {
    lowercase: false,
    softdelete: true,
    index: true,
    prop: 'title',
    slugField: 'slug',
    prefixFetcher: function () {
        if (!this.artist) {
            return new Q('!!! ERROR NO ARTIST LINKED !!!');
        }
        return Q.ninvoke(Artist.findOne({
            _id: this.artist
        }), 'exec')
            .then(function (artist) {
                return artist.slug;
            });
    }
});

/**
*   @name Model:Project.ProjectSchema-pre-validate
*   @function
*   @prop ProjectSchema:validate {middleware} - Hold the save action untill all validation done in this middleware
**/
ProjectSchema.pre('validate', function (next) {
    next();
});

/**
*   @name Model:Project.ProjectSchema-pre-save
*   @function
*   @prop ProjectSchema:save {middleware} - Hold the next middleware untill save complete
**/
ProjectSchema.pre('save', function (next) {
    this.currency = 'USD';
    next();
});

/**
*   @name Model:Project.ProjectSchema-virtual-public
*   @function
*   @prop ProjectSchema:public {middleware} - Define project state before save in table
**/
ProjectSchema.virtual('public')
    .get(function () {
        return this.state === 'published' || this.state === 'expired' || this.state === 'completed';
    });

/**
*   @name Model:Project.ProjectSchema-virtual-attrAccessible
*   @function
*   @prop ProjectSchema:public {middleware} - Define project category before save in table
**/
ProjectSchema.virtual('attrAccessible')
    .get(function () {
        return ['category', 'title', 'description', 'teaserImage', 'youtubeUrl', 'moneyToRaise', 'releaseDate', 'rewards', 'defaultReward', 'denyPublishReason'];
    });

/**
*   @name Model:Project.ProjectSchema-timestamps
*   @desc Set timestamps true
*   @prop ProjectSchema:timestamps {plugin} - set timestamp
**/
ProjectSchema.plugin(timestamps, {
    index: true
});

module.exports = mongoose.model('Project', ProjectSchema);
