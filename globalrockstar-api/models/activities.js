"use strict";
/**
*   @module Models:Activities
*   @description Used for creating the schema and model actions for activities
*   @requires module:mongoose
*   @requires module:mongoose-timestamps
*/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps');

//Define the Reply schema for Activity
var ReplyActivitySchema = new Schema({
    user: {type: Schema.Types.ObjectId, required: true},// Fan or Artist
    userType: String, // "fan" or "artist"
    createdAt: Date,
    message: String,
    flagged: [ActivityFlaggedSchema] //Moderate activity by Admin only
});

//Define the Activity flagged schema for Schema
var ActivityFlaggedSchema = new Schema({
    user: {type: Schema.Types.ObjectId, required: true},// Fan or Artist
    userType: String, // "fan" or "artist"
    createdAt: Date,
    type: String
});

//Define Activities schema 
var ActivitySchema = new Schema({
    artist: {type: Schema.Types.ObjectId, ref: 'Artist', required: true, index: true},
    createdAt: Date,
    country: String,
    continent: String,
    activity: {}, //Activity obejct with type and Id
    replies: [ReplyActivitySchema],// Reply on activity an artist only
    flagged: [ActivityFlaggedSchema] //Moderate activity by Admin only
});

// Add timestamp plugin
ActivitySchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('Activity', ActivitySchema);
