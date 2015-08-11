'use strict';
/**
 *   @module Model:Setting
 *   @description This module is used for providing database interation and schema management to Setting model
 *   @requires module:mongoose
 *   @requires module:q
 *   @requires module:../lib/model-mapper
 **/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Q = require('q'),
    mapFields = require('../lib/model-mapper').mapFields;

/**
 * @namespace
 * @name Model:Setting.Setting
 * @desc Create the schema for Setting table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var Setting = new Schema({
    selfhosting: {
        type: Boolean,
        default: false
    },
    termsPublished: {
        type: Date,
        default: null
    },
    maintenanceNote: {
        type: Boolean,
        default: false
    },
    voteVideo: {
        type: String,
        default: ""
    }

});

/**
 *   @name Model:Setting.updateableFields
 *   @desc contain the static array
 *   @type {array}
 **/
var updateableFields = [
    'voteVideo', 'selfhosting', 'termsPublished', 'maintenanceNote'
];

/**
 *   @name Model:Setting.safeUpdate
 *   @function
 *   @param {string | num} type - used to find the index in the updateableFields array
 *   @param {object} props - passed to mapFields function to get the particular field in the array
 *   @return promise object or error(null)
 **/
Setting.methods.safeUpdate = function (props, type) {
    console.log(props);
    var self = this;
    mapFields(this, props, updateableFields, Setting);
    return Q.ninvoke(self, 'save');
};

module.exports = mongoose.model('Setting', Setting);
