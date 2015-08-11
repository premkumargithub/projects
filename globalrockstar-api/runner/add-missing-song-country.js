'use strict';

require('../lib/database');
var Song = require('../models/song');
var Artist = require('../models/artist');
var Writeable = require('stream').Writable;
var processStream = new Writeable({objectMode: true});

processStream._write = function _read(song, encoding, cb) {
    console.log('processing song %s %s', song._id, song.title);
    Song.update({
        _id: song._id
    }, {
        $set: {
            country: song.artist.country || 'US'
        }
    }, function (err) {
        if (err) {
            console.error('ERROR with id ' + song._id);
            console.error(err);
        }
        cb();
    });
}

processStream.on('end', function() { console.log('END')});
processStream.on('error', function(err) { console.error(err)});
processStream.on('pipe', function(stream) { this.stream = stream; });

Song.find({
    $or: [{
        country: {
            $exists: false
        }
    }, {
        country: ''
    }]
}).populate('artist').limit(1000000).stream().pipe(processStream);
