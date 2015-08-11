"use strict";
/**
 *   @module Model:Video
 *   @description This module is used for providing database interation and schema management to Vote model
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 *   @requires module:q
 *   @requires module:../helper/normalize-urls
 *   @requires module:../lib/model-mapper
 *   @requires module:../lib/get-current-contest
 *   @requires module:../lib/event-emitter
 *   @requires module:../helper/youtube-info
 *   @requires module:../lib/fan-vote-helper
 *   @requires module:./state-history
 *   @requires module:../config
 *   @requires module:node-redis-pubsub
 **/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps'),
    Q = require('q'),
    normalizeUrls = require('../helper/normalize-urls'),
    mapFields = require('../lib/model-mapper').mapFields,
    emitter = require('../lib/event-emitter'),
    youtubeMetaInfo = require('../helper/youtube-info'),
    StateHistory = require('./state-history');


var config = require('../config'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp(config.redis);

/**
 * @namespace
 * @name Model:Video.VideoSchema
 * @desc Create the schema VideoSchema for Video table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var VideoSchema = new Schema({
    youtubeUrl: String,
    category: {type: String, enum: ['call', 'thank-you']},
    flagged_date: Date,
    flagged: Boolean,
    flagged_reason: String,
    artist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    },
    youtube: {
        id: String,
        thumbnails: [String],
        description: String,
        tags: Array,
        author: String,
        keywords: Array,
        title: String,
        category: String,
        uploader: String,
        duration: Number
    },
    state: {type: String, enum: ['active', 'deleted', 'inactive', 'pending'], default: 'pending'},
    stateHistory: [StateHistory]
});

/**
 *   @name Model:Video.VideoSchema-timestamps
 *   @desc Set timestamps true
 *   @prop VideoSchema:timestamps {plugin} - set timestamp
 **/
VideoSchema.plugin(timestamps, {index: true});

/**
 *   @name Model:Video.VideoSchema-normalizeUrls
 *   @desc Set normalizeUrls youtubeUrl
 *   @prop VideoSchema:normalizeUrls {plugin} - set normalizeUrl
 **/
VideoSchema.plugin(normalizeUrls, {fields: ['youtubeUrl']});

/**
 *   @name Model:Video.VideoSchema-path-state
 *   @function
 *   @prop VideoSchema:state {middleware} - Check video state
 *   @returns {string} video state
 **/
VideoSchema.path('state', {
    set: function (value) {

        if (this.get('state') === value) {
            return value;
        }


        if (typeof this.artist === Object && this.state !== value && ['active', 'inactive', 'deleted'].indexOf(value) >= 0) {
            emitter.emit('video:statechange', this, value);
        }



        return value;
    }
});

/**
 *   @nameModel:Video.VideoSchema-methods-loadYoutubeMeta
 *   @function
 *   @fires VideoSchema#loadYoutubeMeta Fires loadYoutubeMeta event for VideoSchema schema
 **/
VideoSchema.methods.loadYoutubeMeta = function (value, cb) {
    youtubeMetaInfo(this, value, cb);
};

VideoSchema.pre('save', function (next) {
    var self = this;
    if (this.isModified('youtubeUrl')) {
        unagi.enqueue('worker:download:video', self);
    }
    next();
});

/**
 *   @name Model:Video.VideoSchema-path-youtubeUrl
 *   @function
 *   @prop VideoSchema:youtubeUrl {middleware} - Check youtube url type{string}
 *   @returns {string} youtube url
 **/
VideoSchema.path('youtubeUrl', {
    set: function (value) {
        var self = this;
        console.log('video:yt-url-change:start:%s', this._id);
        if (this.get('youtubeUrl') !== value) {
            this.loadYoutubeMeta(value, function (err, obj) {
                console.log('video:yt-url-change:meta-loaded:%s', self._id);
                self.yourtube = obj.youtube;
                self.save(function (err) {
                    console.log('video:yt-url-change:save-complete:%s', self._id);
                });
            });
        }

        return value;
    }
});

/**
 *   @name Model:Video.updateableFields
 *   @desc contain the static array
 *   @type {array}
 **/
var updateableFields = {
    profile: ['youtubeUrl', 'category'],
    admin: ['youtube', 'youtubeUrl', 'artist', 'state', 'flagged',
        'flagged_reason', 'flagged_date', 'category']
};

/**
 *   @name Model:Video.safeUpdate
 *   @function
 *   @param {string | num} type - used to find the index in the updateableFields array
 *   @param {object} props - passed to mapFields function to get the particular field in the array
 *   @return promise object or error(null)
 **/
VideoSchema.methods.safeUpdate = function (props, type) {
    console.log('video:safe-update:%s', this._id);
    var self = this;
    mapFields(this, props, updateableFields[type], VideoSchema);
    return Q.ninvoke(self, 'save');
};

module.exports = mongoose.model('SupportVideo', VideoSchema);
