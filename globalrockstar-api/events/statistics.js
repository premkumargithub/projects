'use strict';
/** 
*@module Event:Statistics
*@description this modulle is used for providing the service to statistics related events
*Required modules are defined here
*@requires module:q
*@requires module:ArtistStatistics
*@requires module:FanStatistics
*@requires module:Artist
*@requires module:Fan
*@requires module:Contest
*@requires module:../lib/get-current-contest
**/

var Q = require('q');
var mongoose = require('mongoose');
var ArtistStatistics = mongoose.model('ArtistStatistics');
var FanStatistics = mongoose.model('FanStatistics');

module.exports = function (unagi) {
    /**
    * @name Event:Statistics.unagi-process:artist:votes:add
    * @function
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to prepare the statistics for fans and artists 
    **/
    unagi.process('artist:votes:add', function (event, done) {

        return done() ;

        if (process.env.NODE_ENV === 'test') return done() ;

        var data = event.data;
        if (data.type === 'bonus') return done();
        console.log('artiststats: processing artists vote', event.data);

        var stats = {
            fanId: data.fanId,
            fanType: data.fanType,
            artistId: data.artistId,
            contestId: data.contest,
            contestPhase: data.phase,
            platform: data.platform,
            prop: 'votes.' + data.type
        };

        Q.all([
            ArtistStatistics.add(stats),
            FanStatistics.add(stats)
        ]).then(function () {
            done();
        }).fail(function (err) {
            console.error(err);
            done(err);
        });
    });
};
