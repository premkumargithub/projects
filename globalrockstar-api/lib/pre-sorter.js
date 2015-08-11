'use strict';
/**
 * @module Lib:Pre-Sorter
 * @description Provides a pre shorter actions before sorting the result
 * @requires module:lodash
 * @requires module:mongoose
 */
var _ = require('lodash') ;
var mongoose = require('mongoose');

/**
 * @name Lib:Pre-Sorter.sorter
 * @function 
 * @param {object} req - Request object
 * @param {interface} reply - The callback that handles the response
 * @description Used for populating the query object before sorting the result
 */
var sorter = function (req, reply) {
    var sorter = {
        sort: null
    };
    //Checks query sorting type
    if (req.query.sort) {
        var field = req.query.sort;
        var direction = 1;
        if (req.query.sort.indexOf('-') === 0) {
            direction = -1;
            field = field.replace('-', '');
        }
        sorter.sort = {};
        sorter.sort[field] = direction;
    }
    reply(sorter) ;
};

module.exports = [
    { method: sorter, assign: 'sorter' }
];
