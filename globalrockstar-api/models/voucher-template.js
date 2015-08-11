"use strict";
/**
 *   @module Model:Voucher-Template
 *   @description This module is used for providing database interation to voucher-template model
 *   @requires module:lodash
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 *   @requires module:../public/configs/currencies
 **/

var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamps');
var currencies = require('../public/configs/currencies');

/**
 * @namespace
 * @name Model:Voucher-Template.Reward
 * @desc Create the sub schema with title type[string] for VoucherTemplate table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var Reward = new Schema({
    title: String
});

var amountSchema = {};
_.map(currencies, function (c) {
    amountSchema[c.code] = {
        type: Number,
        required: true,
        default: -1
    };
});

/**
 * @namespace
 * @name Model:Voucher-Template.VoucherTemplate
 * @desc Create the schema for VoucherTemplate table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var VoucherTemplate = new Schema({
    title: {
        type: String,
        required: true
    },
    amount: amountSchema,
    votes: {
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    },
    rewards: [Reward]
});

/**
 *   @name Model:Voucher-Template.VoucherTemplate-timestamps
 *   @desc Bind timestamps plugin to VotingPackage schema
 *   @prop VoucherTemplate:timestamps {plugin} - Bind timestamps plugin to VotingPackage schema
 **/
VoucherTemplate.plugin(timestamps);

module.exports = mongoose.model('VoucherTemplate', VoucherTemplate);
