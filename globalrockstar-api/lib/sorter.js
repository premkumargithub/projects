'use strict';
/**
 * @module Lib:Sorter
 * @description Provides a service to sort the record for mongooseQuery
 * @requires module:mongoose
 */
var mongoose = require('mongoose');

/**
 * @name Lib:Sorter.sorter
 * @function 
 * @param {object} req Request object
 * @param {object} mongooseQuery Service type of object
 * @desc: It sorts the results passed in the argument
 * @throws {MongoError} Will throw an error if mongoose query object not valid.
 */
function sorter(req, mongooseQuery) {
    var msg;
    if (!mongooseQuery.exec) {
        msg = 'Parameter mongooseQuery does not look like a mongoose query object!';
        console.error(msg);
        throw new Error(msg);
    }
    //Checks pre sorter key
    if (!req.pre.sorter) {
        msg = 'req.pre.sorter not set.';
        console.error(msg);
        throw new Error(msg);
    }

    if (req.pre.sorter.sort) {
        return mongooseQuery.sort(req.pre.sorter.sort);
    }
    return mongooseQuery;
}

module.exports = sorter;
