'use strict';
/**
 * @module Lib:Pre-Paginator
 * @description Provides a pre load actions before Db query fires
 * @requires module:lodash
 * @requires module:mongoose
 */
var _ = require('lodash') ;
var mongoose = require('mongoose');

/**
 * @name Lib:Pre-Paginator.paginator
 * @function 
 * @param {object} req - Request object
 * @param {interface} reply - The callback that handles the response
 * @description Get pagination object with page and pagesize
 */
var paginator = function (req, reply) {
    var paginator = {
        page: 0,
        pagesize: 200
    };
    //Checks page number 
    if (req.query.page) {
        paginator.page = req.query.page > 0 ? req.query.page - 1  : 0 ;
    }
    //Checks pagesize
    if (req.query.pagesize) {
        paginator.pagesize = req.query.pagesize ;
    }

    reply(paginator) ;
};

module.exports = [
    { method: paginator, assign: 'paginator' }
];
