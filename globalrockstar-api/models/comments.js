"use strict";
/**
*   @module Models:Comments
*   @description Used for creating the schema and model actions for comments
*   @requires module:mongoose
*   @requires module:mongoose-timestamps
*/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps');

//Define the Reply schema for Comment
var ReplyCommentSchema = new Schema({
    //This is user belongs to artist schema
    user: {type: Schema.Types.ObjectId, required: true}, // Fan or Artist
    userType: String, // "fan" or "artist"
    createdAt: Date,
    message: String,
    likes: Array, //Add likes to reply
    flagged: [CommentFlaggedSchema] // Moderate a reply
});

//Define the Comment flagged schema for Schema
var CommentFlaggedSchema = new Schema({
    //This is user belongs to artist schema
    user: {type: Schema.Types.ObjectId, ref: 'Artist', required: true, index: true},
    createdAt: Date,
    type: String
});

//Define Comments schema 
var CommentSchema = new Schema({
    //This is user belongs to artist schema
    artist: {type: Schema.Types.ObjectId, ref: 'Artist', required: true, index: true},
    createdAt: Date,
    country: String, //Users country code 
    continent: String, //Continent for country
    user: {type: Schema.Types.ObjectId, required: true}, // Fan or Artist
    userType: String, // "fan" or "artist"
    message: String,
    replies: [ReplyCommentSchema], // Add the reply for a comment
    likes: Array, // Add likes to comment
    flagged: [CommentFlaggedSchema] //moderate a comment 
});

// Add timestamp plugin
CommentSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('Comment', CommentSchema);
