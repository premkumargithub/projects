'use strict';
/** 
*@module Event:Fan-count
*@description This module provide the event services to the fans related tasks
*Required module define here for this event module 
*@requires module:../models/artist
*@requires module:mongoose
**/
var Artist = require('../models/artist');
var ObjectId = require('mongoose').Types.ObjectId;

/**
* @function Event:Fan-count.increaseFanCount
* @param {object} artists artists object
* @param {Requester~requestCallback} done - The callback that handles the response.
* @callback Requester~requestCallback: done
* @description This is used check either artist object is empty or not
* then call the Artist collection to increase the fans, update the artists object
*/
function increaseFanCount(artists, done) {
    if (!artists.length) return done();
    var artistIds = artists.map(ObjectId);
    Artist.collection.update({_id: {$in: artistIds}}, {$inc: {fanCount: 1}}, {multi: true}, done);
}

/**
* @function Event:Fan-count.increaseFanCount
* @param {object} artists artists object
* @param {Requester~requestCallback} done - The callback that handles the response.
* @callback Requester~requestCallback: done
* @description This is used check either artist object is empty or not
* then call the Artist collection to update the artists object
*/
function decreaseFanCount(artists, done) {
    if (!artists.length) return done();
    var artistIds = artists.map(ObjectId);
    Artist.collection.update({_id: {$in: artistIds}}, {$inc: {fanCount: -1}}, {multi: true}, done);
}

module.exports = function (unagi) {
    /**
    * @name Event:Fan-count.unagi-process:fan:state:transition:visible
    * @function
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to increase the fans count
    **/
    unagi.process('fan:state:transition:visible', function (job, done) {
        increaseFanCount(job.data, done);
    });
    /**
    * @name Event:Fan-count.unagi-process:fan:state:transition:visible
    * @function
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to decrease the fans count
    **/
    unagi.process('fan:state:transition:invisible', function (job, done) {
        decreaseFanCount(job.data, done);
    });
    unagi.process('artist:state:transition:visible', function (job, done) {
        increaseFanCount(job.data, done);
    });
    unagi.process('artist:state:transition:invisible', function (job, done) {
        decreaseFanCount(job.data, done);
    });
};
