'use strict';

/**
 * @module Models:exchange-rate
 *
 * @description Model representing exchangerates collection on MongoDB, intended to save exchange rates retrieved from Yahoo Finance API
 *
 * @requires module:mongoose
 * @requires module:mongoose-timestamps
 * @requires module:q
 * @requires module:../config
 *
 */
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamps');
var Q = require('q');
var config = require('../config');
var Schema = mongoose.Schema;

var ExchangeRateSchema = new Schema({
    source: {
        type: String,
        required: true
    },
    rates: {
        type: Schema.Types.Mixed,
        required: true
    }
});

// Get current exchange rates
ExchangeRateSchema.statics.current = function () {
    var dfd = Q.defer();
    Q.ninvoke(mongoose.model('ExchangeRate').find({}).sort({
        createdAt: -1
    }).limit(1), 'exec')
        .then(function (results) {
            if (results.length !== 1) {
                return dfd.reject(new Error('No Exchanges rates available!'));
            }
            return dfd.resolve(results[0]);
        })
        .fail(function (err) {
            console.error(err);
            return dfd.reject(err);
        });

    return dfd.promise;
};

// Add timestamps plugin
ExchangeRateSchema.plugin(timestamps, {
    index: true
});

module.exports = mongoose.model('ExchangeRate', ExchangeRateSchema);
