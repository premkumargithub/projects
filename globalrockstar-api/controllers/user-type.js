'use strict';
/**
 * @module Controller:userType
 *
 * @description Provides information about an artist
 *
 * @requires module:mongoose
 * @requires module:hapi
 * @requires module:../config
 * @requires module:../lib/mongoose-hapi-errors
 * @requires module:q
 * @requires module:node-redis-pubsub
 *
 */
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var Fan = mongoose.model('Fan')
var Hapi = require('hapi');
var config = require('../config');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var Q = require('q');


module.exports = {

    /**
    	*	@function
    	*	@name Controller:userType.getType
    	*	@param {object}req - Contain the data regarding the request
    	*	@param {interface}reply - interface for giving the reply
    	**/
    getType : function (req, reply) {
        // assign the object to a query variable
        var query = {'email' : req.params.email};
        // fireing the query in the artist collection
        // In this query we find the artist by match the email
        Artist.findOne(query).exec(function (err, artistType) {
            // return error if we get the error
            if (err) {
                return reply(err);
            }
            if (artistType) {
                // if we get the artist then send type equal to artist
                // in response
                reply({'type': 'Artist'});
            }else {
                // fireing the query in the fan collection
                // In this query we find the fan by match the email
                Fan.findOne(query).exec(function (err, fan) {
                    if (err) {
                        // return error if we get error in the query
                        return reply(err);
                    }
                    if (fan) {
                        // if we get the fan then send type equal to fan
                        // in response
                        reply({'type' : 'fan'});
                    }else {
                        // if we not get fan in the response then
                        // we send invalid in response
                        reply({'type': 'invalid'});
                    }
                });
            }
        });
    }

};
