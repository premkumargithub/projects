'use strict';
/**
 *   @module Model:Slider
 *   @description This module is used for providing database interation and schema management to Slider model
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 *   @requires module:mongoose-slugify
 *   @requires module:../config
 *   @requires module:node-redis-pubsub
 **/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps'),
    slugify = require('mongoose-slugify');

var config = require('../config'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp(config.redis);

/**
 * @namespace
 * @name Model:Slider.Slider
 * @desc Create the schema for Slider table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var Slider = new Schema({
    name: {
        type: String,
        required: true
    },
    youtubeUrl: {
        type: String
    },
    image: {
        type: String
    },
    image_text: {
        type: String
    },
    video: {
        type: String
    },
    video_webm: {
        type: String
    },
    text: {
        type: String
    },
    headline: {
        type: String
    },
    position: {
        type: Number,
        default: 0
    },
    link: {
        type: String
    },
    linkLabel: {
        type: String
    },
    priority: {
        type: Boolean,
        default: false
    },
    public: {
        type: Boolean,
        default: false
    }
});

Slider.virtual('attrAccessible')
    .get(function () {
        return ['name', 'youtubeUrl', 'video_webm', 'headline', 'position', 'image', 'image_text', 'video', 'text', 'link', 'linkLabel', 'priority', 'public'];
    });

Slider.plugin(slugify, {
    position: "pre",
    lowercase: true,
    softdelete: false,
    index: true,
    prop: 'name',
    slugField: 'slug'
});

/**
 *   @name Model:Slider.Slider-timestamps
 *   @desc Bind timestamps plugin to Slider schema
 *   @prop Slider:timestamps {plugin} - Bind timestamps plugin to Slider schema
 **/
Slider.plugin(timestamps, {index: true});

/**
 * @name Model:Slider.Slider-pre
 * @function
 * @param {object} next - Next event object
 * @description Used to check either youtubeUrl is modified
 * @prop Slider:save {middleware} Pass the event to next step
 *
 */
Slider.pre('save', function (next) {
    var self = this;
    if (this.isModified('youtubeUrl')) {
        unagi.enqueue('worker:download:video', self);
    }
    next();
});

module.exports = mongoose.model('Slider', Slider);
