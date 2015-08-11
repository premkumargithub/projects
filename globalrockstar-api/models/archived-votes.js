'use strict';

/**
 * @module Models:archived-votes
 *
 * @description Model representing archivedvotes collection on MongoDB, intended to save archived votes
 *
 * @requires module:mongoose
 * @requires module:./vote
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    schemaDef = require('./vote').schemaDef;

var ArchivedVote = new Schema(schemaDef);

module.exports = mongoose.model('ArchivedVote', ArchivedVote);
