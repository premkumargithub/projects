'use strict';

require('../lib/database');
var Fan = require('../models/fan');
var Artist = require('../models/artist');
var Q = require('q');
var Writeable = require('stream').Writable;
var processStream = new Writeable({objectMode: true});

processStream._write = function _read(artist, encoding, cb) {
    console.log('processing artist %s %s', artist._id, artist.name);
    var fanCount;
    Q.all([
        Q.ninvoke(Fan       , 'count'    , {fan_of_artist: artist._id , state: { $in: ['active' , 'pending']}}) ,
        Q.ninvoke(Artist    , 'count'    , {fan_of_artist: artist._id , state: { $in: ['active' , 'pending']}})
    ]).spread(function(fans , artists) {
        fanCount = fans + artists;
        return Q.ninvoke(Artist, 'update', {_id: artist._id}, {$set: { fanCount: fanCount}});
    }).then(function () {
        console.log('updated artist %s: fans: %s', artist.name, fanCount);
        cb();
    }).fail(function (err) {
        console.error(err);
        cb();
    });
};

processStream.on('end', function() { console.log('END')});
processStream.on('error', function(err) { console.error(err)});
processStream.on('pipe', function(stream) { this.stream = stream; });

Artist.find({}, {_id: 1, name: 1}).limit(1000000).stream().pipe(processStream);
