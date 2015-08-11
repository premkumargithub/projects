"use strict";
/**
 *   @module Model:Voting-Package
 *   @description This module is used for providing database interation and schema management to Voting-package model
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 **/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps');

/**
 * @namespace
 * @name Model:Voting-Package.VotingPackage
 * @desc Create the schema for VotingPackage table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var VotingPackage = new Schema({
    contest: {
        type: Schema.Types.ObjectId,
        ref: 'Contest'
    },
    artist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    },
    template: {
        type: Schema.Types.ObjectId,
        ref: 'VoucherTemplate'
    },
    reward: Schema.Types.ObjectId,
    song: {
        type: Schema.Types.Object,
        ref: 'Song'
    },
    bought: {
        type: Number,
        default: 0
    }
});

/**
 *   @name Model:Voting-Package.VotingPackage-timestamps
 *   @desc Bind timestamps plugin to VotingPackage schema
 *   @prop VotingPackage:timestamps {plugin} - Bind timestamps plugin to VotingPackage schema
 **/
VotingPackage.plugin(timestamps);

module.exports = mongoose.model('VotingPackage', VotingPackage);
