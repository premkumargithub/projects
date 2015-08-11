'use strict';
/** 
*@module Event:Charts
*@description This module provide the service to the 
*Required module define here for this event module 
*@requires module:../lib/contest-administration
*@requires module:../lib/agenda
**/

var ContestAdmin = require('../lib/contest-administration') ;
var agenda = require('../lib/agenda');

module.exports = function (unagi) {
    /**
    * @name Event:Charts.unagi-process:contests:updated
    * @function
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to insert the artists data in the Badge collection
    **/
    unagi.process('contests:updated', function (job, done) {

        var bootstrapName   = 'contests:phase:bootstrap:' + job.data.id ;
        var transferName    = 'contests:phase:transfer:'  + job.data.id ;
        var normalizeName   = 'contests:phase:normalize:' + job.data.id ;

        agenda.cancel({name: { $in: [bootstrapName, transferName, normalizeName] } }, function (err, numRemoved) {

            // define bootstrap job
            agenda.define(bootstrapName, function (job, done) {
                ContestAdmin.bootstrap(job.attrs.data.contest, function (err, res) {
                    if (!err) return done() ;
                    done(err) ;
                }) ;
            }) ;

            // define transfer job
            agenda.define(transferName, function (job, done) {
                var toPhase = job.attrs.data.to ;
                var contestId = job.attrs.data.contest.id ;

                ContestAdmin.transferTo(job.attrs.data.to, job.attrs.data.contest, function (err, res) {
                    unagi.emit('contests:phase:transfer', {
                        to: toPhase,
                        contestId: contestId
                    }) ;

                    if (!err) return done() ;
                    done(err) ;
                    console.log(err);
                }) ;
            }) ;

            // define normalize job
            agenda.define(normalizeName, function (job, done) {
                var inPhase = job.attrs.data.in ;
                var contestId = job.attrs.data.contest.id ;
                var withCountries = inPhase == 'np' ;
                ContestAdmin.normalize(inPhase, job.attrs.data.contest, withCountries,  function (err, res) {
                    unagi.emit('contests:phase:normalize', {
                        in: inPhase,
                        contestId: contestId
                    }) ;

                    ContestAdmin.transferTo(job.attrs.data.to, job.attrs.data.contest, function (err, res) {
                        if (!err) return done() ;
                        done(err) ;
                        console.log(err) ;
                    }) ;
                }) ;
            }) ;

            // -----------------------------------------------
            // schedule stuff
            if (new Date(job.data['np'].time.start) > new Date()) {
                console.log("schedule bootstrap");
                agenda.schedule(new Date(job.data['np'].time.start), bootstrapName, {
                    contest: job.data
                }) ;
            }

            var phases = ['np', 'globalfinalsQualification', 'globalfinalsBest64', 'globalfinalsBest16'] ;
            //phases.map( function(fromPhase) {
            //if( new Date(job.data[fromPhase].time.start) > new Date() ) {
            //console.log("schedule transfer to " + fromPhase);
            //agenda.schedule(new Date(job.data[fromPhase].time.start ), transferName, {
            //to: fromPhase,
            //contest: job.data
            //}) ;
            //}
            //}) ;

            phases.map(function (fromPhase) {

                var idx = phases.indexOf(fromPhase) ;
                if (idx < 3) {
                    if (new Date(job.data[fromPhase].time.end) > new Date()) {
                        console.log("schedule normalize in " + fromPhase);
                        var toPhase = phases[ idx + 1 ] ;
                        agenda.schedule(new Date(job.data[fromPhase].time.end), normalizeName, {
                        in: fromPhase,
                        to: toPhase,
                        contest: job.data
                    }) ;
                    }
                }

            }) ;

            done() ;

        }) ;

    });
};
