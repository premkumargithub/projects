'use strict';

// re-create chart entries for contest and phase, based on votes

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    Hapi = require('hapi');
    
var agenda = require('../lib/agenda');
var Q = require('q');
var ChartEntry = require('../models/chart_entry') ;
var Contest = require('../models/contest');
var Vote = require('../models/vote');
var Song = require('../models/song');
var Artist = require('../models/artist');
var config = require('../config');

var contestAdmin = require('../lib/contest-administration') ;

var time;



  
function getVotesForPhase(contest, phase) {
    console.log("getVotesForPhase %s %s", contest, phase);
    var contestId = mongoose.Types.ObjectId(contest);
    var payload = [{
        $match: {
            status: 'processed',
            type: { $in: ['facebook', 'twitter', 'purchase', 'bonus', 'fan']},
            phase: phase,
            contest: contestId
        }
    }, {
        $group: {
            _id: '$artist',
            votes: {$sum: 1},
            artist: { $first: '$artist' },
            song: { $first: '$song' },
            voteRefs: { $push: '$_id' },
            
            twitter: {$sum: {$cond: [{$eq: [ "$type", 'twitter']}, 1, 0]}},
            facebook: {$sum: {$cond: [{$eq: [ "$type", 'facebook']}, 1, 0]}},
            purchase: {$sum: {$cond: [{$eq: [ "$type", 'purchase']}, 1, 0]}},
            dummy: {$sum: {$cond: [{$eq: [ "$type", 'dummy']}, 1, 0]}},
            bonus: {$sum: {$cond: [{$eq: [ "$type", 'bonus']}, 1, 0]}},
            fan: {$sum: {$cond: [{$eq: [ "$type", 'fan']}, 1, 0]}},
            
            ios: {$sum: {$cond: [{$eq: [ "$platform", 'ios']}, 1, 0]}},
            android: {$sum: {$cond: [{$eq: [ "$platform", 'android']}, 1, 0]}},
            desktop: {$sum: {$cond: [{$eq: [ "$platform", 'desktop']}, 1, 0]}},
            
            serie: {$sum: {$cond: [{$eq: [ "$series_vote", true]}, 1, 0]}},
        }
    }, {
        $project: {
            _id: 1,
            votes: 1,
            artist: 1,
            song: 1,
            voteRefs: 1,
            
            voteTypes: {
                twitter: '$twitter',
                facebook: '$facebook',
                purchase: '$purchase',
                dummy: '$dummy',
                bonus: '$bonus',
                fan: '$fan',
                ios: '$ios',
                android: '$android',
                desktop: '$desktop',
                serie: '$serie'
            }
        }
    }] ;
    
    console.log(payload);
    
    return Q.ninvoke(Vote, 'aggregate', payload);
}

function getCountries(contest) {
    return Q.ninvoke( Song, 'aggregate', [
        { '$match': { state: 'active', contest: mongoose.Types.ObjectId(contest) } },
        { '$group': { _id: '$_id', country: { $first: '$country' } }}
    ]) ;

}
function recreateChartEntries( contest, phase ) {
    console.log("recreate chart entries ");
    
    Q.all([
        getVotesForPhase( contest, phase ), 
        getCountries(contest)
    ]).spread( function(votes, countries) {
        
        console.log(votes);
        countries           = _.groupBy(countries, function(el) { return el._id.toString() ; }) ;
        var chartEntries    = votes.map( function(chartEntry) {
            var country = countries[ chartEntry.song ] ;
            chartEntry.country = country ? country[0].country : '' ;
            chartEntry.phase = phase ;
            chartEntry.contest = mongoose.Types.ObjectId(contest) ;
            delete chartEntry._id ;
            return chartEntry ;
        }) ;
        return [
            [], //Q.ninvoke( ChartEntry, 'remove', { contest: mongoose.Types.ObjectId(contest), phase: phase } ),
            chartEntries
        ] ;
    }).spread( function(deleted, chartEntries) {
        console.log(deleted.length );
        
        return [ /*Q.ninvoke( contestAdmin, 'bootstrap', { _id: contest } )*/ true, chartEntries ] ;
    }).spread( function(bootstraped, chartEntries) {
        return chartEntries.map( function(entry) {
            ChartEntry.findOneAndUpdate({
                contest: entry.contest,
                song: entry.song,
                artist: entry.artist,
                phase: entry.phase
            }, entry, function(err, res) {
                console.log(err);
            })
        }) ;
        
    }).then( function(chartEntries) {
        console.log(chartEntries.length);
    }).fail( function(err) {
        console.log(err);
    })

}


recreateChartEntries( '5391bc6069758716a25bb4a2', 'np') ;
