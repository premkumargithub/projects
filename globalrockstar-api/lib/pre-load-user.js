'use strict';
/**
 * @module Lib:Pre-Load-User
 * @description Provides a feature to pre load user before Db query fires
 * @requires module:hapi
 */
var Hapi = require('hapi');

/**
 * @name Lib:Pre-Load-User.loadUser
 * @function 
 * @param {string} type model type 
 */
module.exports = function loadUser(type) {
    var User = require('../models/' + type);

    return function (req, reply) {
        if (!req.params.userId) return reply();
        //Get user for userId
        User.findById(req.params.userId, function (err, user) {
            if (err) return reply(err);
            if (!user) return reply(Hapi.error.notFound());
            reply(user);
        });
    };
};
