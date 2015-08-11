"use strict";
/**
 *   @module Model:Aupport-Ticket
 *   @description This module is used for providing database interation and schema management to support-ticket model
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 **/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps'),
    StateHistory = require('./state-history');

/**
 * @namespace
 * @name Model:Aupport-Ticket.SupportTicket
 * @desc Create the schema for SupportTicket table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var SupportTicket = new Schema({
    firstname: String,
    lastname: String,
    email: String,
    category: String,
    message: String,
    state: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread'
    },
    stateHistory: [StateHistory]
});

/**
 *   @name Model:Aupport-Ticket.SupportTicket-virtual-attrAccessible
 *   @function
 *   @prop SupportTicket:attrAccessible {middleware} - Define the keys to be access
 **/
SupportTicket.virtual('attrAccessible')
    .get(function () {
        return ['firstname', 'lastname', 'email', 'state', 'category', 'message'];
    });

/**
 *   @name Model:Aupport-Ticket.SupportTicket-timestamps
 *   @desc Set timestamps true
 *   @prop SupportTicket:timestamps {plugin} - set timestamp
 **/
SupportTicket.plugin(timestamps, {index: true});

module.exports = mongoose.model('SupportTicket', SupportTicket);
