'use strict';

require('../lib/database');
var Song = require('../models/song');
var countries = require('../lib/mapped-countries');
var Writeable = require('stream').Writable;
var processStream = new Writeable({objectMode: true});

processStream._write = function _read(song, encoding, cb) {
    console.log('processing song %s %s', song._id, song.title);
    console.log('setting countryname to %s %s', song.country, countries[song.country]);
    if (!countries[song.country]) {
        cb();
        return console.error('Can not find country name for %s', song.country);
    }
    Song.update({
        _id: song._id
    }, {
        $set: {
            countryname: countries[song.country]
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
    countryname: {
        $exists: false
    }
}).limit(1000000).stream().pipe(processStream);
