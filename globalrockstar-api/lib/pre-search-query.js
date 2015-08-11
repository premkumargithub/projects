'use strict';
/**
 * @module Lib:Pre-Search-Query
 * @description Used to prepare the query before making search query on DB
 * @requires module:lodash
 * @requires module:mongoose
 */
var _ = require('lodash');
var mongoose = require('mongoose');

RegExp.quote = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
};

/**
 * @name Lib:Pre-Sorter.searchQuery
 * @function 
 * @param {object} req - Request object
 * @param {interface} reply - The callback that handles the response
 * @description Used for populating the query object before sorting the result
 */
var searchQuery = function (req, reply) {
    var query = {};

    if (req.query.search) {
        if (!query.$and) {
            query.$and = [];
        }

        console.dir(req.query.search);
        req.query.search = _.inject(req.query.search, function (ret, val, key) {

            if (val.ObjectId) {
                ret[key] = mongoose.Types.ObjectId(val.ObjectId);
                return ret;
            }

            if (val.$eq) {
                ret[key] = val.$eq;
                return ret;
            }

            //console.log('Key: ' + key + ' type: ' + typeof(val) + ' val:' + val + ' ' + isNaN(val));
            if (key === 'moneyToRaise' || key === 'nPos') {
                if (val === '' || isNaN(val)) {
                    return ret;
                }

                ret[key] = parseInt(val, 10);
                return ret;
            }

            if (key === 'stars') {
                if (val === '' || isNaN(val)) {
                    return ret;
                }

                ret[key] = parseInt(val, 10);
                return ret;
            }

            if (key === 'createdAt') {
                if (val === '') {
                    return ret ;
                }
                ret[key] = new Date(val) ;
                return ret ;
            }

            // Query these keys as exact values
            if (key === 'state' || key === 'country' || key === 'phase' || key === 'genres_own' || key === 'genres' || key === 'featured') {
                if (val && val !== '') {
                    ret[key] = val;
                }
                return ret;
            }

            if (typeof val === 'object') {
                if (typeof val.$exists !== 'undefined') {
                    val.$exists = val.$exists === 'true';
                }
                ret[key] = val;
                return ret;
            }

            if (key === 'contest' || key === 'artist' || key === 'voter_artist' || key === 'voter_fan') {
                ret[key] = mongoose.Types.ObjectId(val);
                return ret;
            }


            if (val !== '')  {
                ret[key] = new RegExp(RegExp.quote(val), 'i');
            }

            return ret;
        }, {});

        console.log("\n\nTHA QUERY =>");
        console.dir(req.query.search);
        console.log('\n\n');
        query.$and.push(req.query.search);
    }

    reply(query);
};

module.exports = [{
    method: searchQuery,
    assign: 'search'
}];
