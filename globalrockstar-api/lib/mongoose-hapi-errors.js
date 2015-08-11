/**
 * @module Lib:mongoose-hapi-errors
 *
 * @description Improve hapi errors with mongoose data
 *
 * @requires hapi
 * @requires lodash
 */
var Hapi = require('hapi');
var _ = require('lodash');

/**
 * Improve hapi errors with mongoose data
 * @param {object} err error object
 * @returns {object} improved error object
 */
module.exports = function (err) {
    var error = Hapi.error.badRequest(err.message);
    error.output.payload.data = _.map(err.errors, function (val, key) {
        return {
            message: val.message,
            path: key,
            type: 'invalid'
        };
    });
    return error;
};