'use strict';
/**
 * @module Lib:Pre-Load-model
 * @description Provides a pre load actions before Db query fires
 * @requires module:hapi
 */
var Hapi = require('hapi');

/**
 * @name Lib:Pre-Load-model.singleHandler
 * @function 
 * @param {object} Model Current Model object
 * @param {string} param key that used to filter the records from Model
 */
function singleHandler(Model, param) {
    return function (req, reply) {
        //checks param is empty
        if (!req.params[param]) return reply();
        //Get records based on the param argument
        Model.findById(req.params[param], function (err, obj) {
            if (err) return reply(err);
            if (!obj) return reply(Hapi.error.notFound());
            reply(obj);
        });
    };
}

/**
 * @name Lib:Pre-Load-model.collectionHandler
 * @function 
 * @param {object} Model Current Model object
 * @desc Used to grab all the records from the current Model Object
 */
function collectionHandler(Model) {
    return function (req, reply) {
        Model.find({}, function (err, collection) {
            if (err) return reply(err);
            reply(collection);
        });
    };
}

/**
 * @name Lib:Pre-Load-model.loadUser
 * @function
 * @param {string} type model type 
 * @param {string} param 
 */
module.exports = function loadUser(type, param) {
    var Model = require('../models/' + type);

    if (param) {
        return singleHandler(Model, param);
    } else {
        return collectionHandler(Model);
    }
};
