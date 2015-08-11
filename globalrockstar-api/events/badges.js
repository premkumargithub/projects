'use strict';
/** 
*@module Event:Badges
*@description This module provide the service to the 
*Required module define here for this event module 
*@requires module:q
*@requires module:mongoose
**/
var mongoose = require('mongoose');
var Badge = mongoose.model('Badge');

module.exports = function (unagi) {
    /**
    * @name Event:Badges.unagi-process:contests:transfer:createbadges
    * @function
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to insert the artists data in the Badge collection
    **/
    unagi.process('contests:transfer:createbadges', function (job, done) {
        var data = job.data;
        var type;
        if (data.from == 'np') type = 'nationalwinner';
        if (data.to == 'globalfinalsBest64') type = 'bestof64';
        if (data.to == 'globalfinalsBest16') type = 'bestof16';
        if (data.to == 'finals') type = 'globalrockstar';

        if (!type) {
            console.error('badge:create:no phase matching');
            console.error(job.from, job.to);
            done();
        }

        if (!data.artists.length) return done();
        //Insert the artists in the DB
        Badge.collection.insert(data.artists.map(function (artist) {
            return {
                userId: mongoose.Types.ObjectId(artist),
                userType: 'artist',
                type: type,
                contest: mongoose.Types.ObjectId(data.contest)
            };
        }), function (err) {
            if (err) console.error(err);
            if (!err) console.log('badges:generated:%s', type);
            done(err);
        });
    });
    /**
    * @name Event:Badges.unagi-process:contests:wildcards:createbadges
    * @function
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to insert the artists data in the Badge collection
    **/
    unagi.process('contests:wildcards:createbadges', function (job, done) {
        var data = job.data;
        var type = "wildcard";

        if (!data.artists.length) return done();

        Badge.collection.insert(data.artists.map(function (artist) {
            return {
                userId: mongoose.Types.ObjectId(artist),
                userType: 'artist',
                type: type,
                contest: mongoose.Types.ObjectId(data.contest)
            };
        }), function (err) {
            if (err) console.error(err);
            if (!err) console.log('badges:generated:%s', type);
            done(err);
        });
    });

};
