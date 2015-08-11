process.env.NODE_ENV = 'legacy' ;

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    Hapi = require('hapi');

console.log(config) ;

var transform = require('stream-transform') ;

var Artist = mongoose.model('Artist') ;
var fs = require('fs') ;

var csv = require('fast-csv') ;

var stream = fs.createReadStream("./_legacy/artists.csv");
var request = require('request') ;

var notFound = 0 ;

var fs = require('fs'),
    request = require('request');

var csvStream = csv({delimiter:','})
 .on("record", function(data){

    var userId = data[0].trim() ;

    Artist.find({"email" : data[4].trim(), createdAt: { $lt: new Date('08.11.2014 17:00')}}, function(err, count) {
        if( count.length > 0 ) {
            console.log(count[0].createdAt + " - " + userId + " - " + data[1] + " - " + data[2] + " - " + data[3] + " - " + data[4] ) ;
        }
    }) ;

 })
 .on("end", function(){
     console.log("done");
 });

stream.pipe(csvStream);
