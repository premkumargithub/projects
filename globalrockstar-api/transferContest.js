//process.env.NODE_ENV = 'legacy' ;

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    currentContest = require('./lib/get-current-contest') ;
    CA = require('./lib/contest-administration'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Hapi = require('hapi');

console.log(config) ;
// globalfinalsBest64
// globalfinalsQualification

currentContest().then( function(contest) {
//    CA.transferTo('np', 'globalfinalsQualification', contest, function(err,stuff) {
    CA.transferTo('globalfinalsQualification', 'globalfinalsBest64', contest, function(err,stuff) {
        console.log(err);
        console.log(stuff);
    }) ;
}) ;
