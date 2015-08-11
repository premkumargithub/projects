'use strict';
/**
 * @module Routes:frontend-admins
 *
 * @description Provides routes to create, read, update and delete information
 *
 * @requires module:../models/frontend-admin
 * @requires module:q
 * @requires module:joi
 * @requires module:pretty-hapi-errors
 */
var frontendAdmin = require('../models/frontend-admin');
var Q = require('q');
var Joi = require('joi');
var PrettyHapiErrors = require('pretty-hapi-errors');

var adminSchema = Joi.object({
    userId: Joi.string().required(),
    userType: Joi.string().required()
}).options({
    abortEarly: false,
    allowUnknown: true
});

module.exports = function (server) {
    server.route([{
        method: 'GET',
        path: '/frontend-admins/{type}/{id}',
        /**
         * Get the a frontend admin given the specified {id} and {type}
         *
         * @param {object} req - Request object
         * @param {function} reply - hapi reply interface
         */
        handler: function (req, reply) {
            Q.ninvoke(frontendAdmin, 'findOne', {userType: req.params.type, userId: req.params.id})
                .then(reply)
                .fail(reply);
        }
    }, {
        method: 'GET',
        path: '/frontend-admins/{type}',
        /**
         * Get the frontend admins given the specified {type}
         *
         * @param {object} req - Request object
         * @param {function} reply - hapi reply interface
         */
        handler: function (req, reply) {
            Q.ninvoke(frontendAdmin, 'find', {userType: req.params.type})
                .then(reply)
                .fail(reply);
        }
    }, {
        method: 'POST',
        path: '/frontend-admins',
        /**
         * Get all the frontend admins
         *
         * @param {object} req - Request object
         * @param {function} reply - hapi reply interface
         */
        handler: function (req, reply) {
            Q.ninvoke(frontendAdmin, 'findOne', req.payload)
                .then(function (feAdmin) {
                    console.dir(feAdmin);
                    if (feAdmin) {
                        return reply({status: 'success'});
                    }
                    var admin = frontendAdmin(req.payload);
                    console.dir(admin);
                    return Q.ninvoke(admin, 'save');
                }).then(function () {
                    reply({
                        status: 'success'
                    });
                }).fail(reply);
        },
        config: {
            validate: {
                payload: adminSchema,
                failAction: PrettyHapiErrors
            }
        }
    }, {
        method: 'DELETE',
        path: '/frontend-admins',
        /**
         * Delete a frontend admin
         *
         * @param {object} req - Request object
         * @param {function} reply - hapi reply interface
         */
        handler: function (req, reply) {
            Q.ninvoke(frontendAdmin, 'remove', req.payload)
                .then(function () {
                    reply({status: 'success'});
                }).fail(reply);
        },
        config: {
            validate: {
                payload: adminSchema,
                failAction: PrettyHapiErrors
            }
        }
    }]);
};
