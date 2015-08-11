'use strict';
/**
 * @module Lib:Paginator
 * @description Provides a pagination action to the mongooseQuery
 * @requires module:mongoose
 */
var mongoose = require('mongoose');

/**
 * @name Lib:Paginator.paginator
 * @function 
 * @param {object} req Request object
 * @param {object} mongooseQuery Service type of object
 * @desc: It updates the skip and limit keys in the mongoose query object
 * @throws {MongoError} Will throw an error if mongoose query object not valid.
 */
function paginator(req, mongooseQuery) {
    var msg;
    if (!mongooseQuery.exec) {
        msg = 'Parameter mongooseQuery does not look like a mongoose query object!';
        console.error(msg);
        throw new Error(msg);
    }
    if (!req.pre.paginator) {
        msg = 'req.pre.paginator not set.';
        console.error(msg);
        throw new Error(msg);
    }
    return mongooseQuery.skip(req.pre.paginator.pagesize * req.pre.paginator.page).limit(req.pre.paginator.pagesize);
}

module.exports = paginator;
