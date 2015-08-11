'use strict';
/**
 *@module Contoller:Settings
 *@description this modulle is used for managing the setting of the adminstration
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:Setting
 *@requires module:hapi
 *@requires module:../config
 *@requires module:q
 **/

var mongoose = require('mongoose');
var Setting = mongoose.model('Setting');
var Hapi = require('hapi');
var config = require('../config');
var Q = require('q');
var findSetting = Q.nbind(Setting.findOne, Setting);
var createSetting = Q.nbind(Setting.create, Setting);

module.exports = {};

/**
 * @name Contoller:Settings.setSetting
 * @function
 * @param {object} req - Request object
 * @param {interface} reply - hapi reply interface
 * @description This is function is used for retrieving the user's setting
 * @returns {object} Setting object
 */
var setSetting = function (req, reply) {
    findSetting()
        .then(function (setting) {
            if (!setting) {
                return createSetting({});
            }
            return setting;
        })
        .then(function (setting) {
            return reply(setting);
        })
        .fail(function (err) {
            reply(err);
        });
};

module.exports.preSetting = [{assign: 'setting', method: setSetting}];

/**
 * Returns an instance of Contoller:Settings.setSetting.
 * @alias module:setSetting.index
 * @returns A setSetting instance.
 */
module.exports.index = setSetting;

/**
 * Returns an instance of setSetting.
 * @alias module:controller.settings.index
 * @param {object} req - Request object
 * @param {interface} reply - hapi reply interface
 * @description This is function is used for updating the user's setting
 * @returns {object} Setting object
 */
module.exports.update = function (req, reply) {
    var setting = req.pre.setting;
    setting.safeUpdate(req.payload)
        .then(function (setting) {
            return reply(setting);
        })
        .fail(function (err) {
            return reply(err);
        });
};
