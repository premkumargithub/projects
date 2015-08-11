'use strict';

/**
 * @module Routes:userType
 *
 * @description Provides routes to create, read,
 * update and delete most of the available information about artists
 *
 * @requires module:../controllers/user-type
 * @requires module:pretty-hapi-errors
 * @requires module:../lib/pre-search-query
 *
 *
 **/
var userTypeController = require('../controllers/user-type'),
PrettyHapiErrors = require('pretty-hapi-errors'),
preSearchQuery = require('../lib/pre-search-query');

module.exports = function (server) {

    server.route([
    	/**
	    *   @event
	    *   @name route:userType./user/type/{email}
	    *   @param {string}email - used to get the type of the user
	    *   @desc This event fire to get the type of the user that is 
	    *	ARTIST OR FAN
	    **/
        {
            method: 'GET',
            path: '/user/type/{email}',
            config: {
                handler: userTypeController.getType
            }
        }
	]);
};
