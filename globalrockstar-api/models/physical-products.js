"use strict";
/**
*   @module Models:Physical-Products
*   @description Provides the schema for physical prodcuts
*   @requires module:mongoose
*   @requires module:mongoose-timestamps
*/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps'),
    emitter = require('../lib/event-emitter'),
    states = require('../public/configs/states.json'),
    StateHistory = require('./state-history');

//Define the schema for Physical products
var PhysicalProductsSchema = new Schema({
    ////// MANDATORY FIELDS //////
    predefined: Boolean,
    type: {index: true, type: String},
    price: Number,
    shipping_included: Boolean,
    stock_handling: Number,
    title: String,
    description: String,
    // Artist reference to artist's model is mandatory, every physical product should have an artist
    artist: {type: Schema.Types.ObjectId, ref: 'Artist', index: true},

    ////// OPTIONAL FIELDS //////
    
    // Version 2 is for documents created starting from the 2015
    gr_doc_ver: Number, // Version 2 is for documents created starting from the 2015

    // Current State of the song (see states array)
    state: {index: true, type: String, enum: states},

    // History of states' changes
    stateHistory: [StateHistory]
});

PhysicalProductsSchema.index({artist: 1});

// Create and update timestamps fields "createdOn" and "modifiedOn"
PhysicalProductsSchema.plugin(timestamps, {
    index: true
});

// Emit an event every time state *changes to* active, inactive or deleted
PhysicalProductsSchema.path('state', {
    set: function (value) {
        if (value === 'active' || value === 'inactive' || value === 'deleted') {
            // Emit a statechange event if physical product 's state changes
            emitter.emit('physical_product:statechange', this, value);
        }
        return value;
    }
});

module.exports = mongoose.model('PhysicalProducts', PhysicalProductsSchema);
