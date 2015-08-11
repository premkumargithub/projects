/* global db, print */
// to be run in mongo shell
'use strict';

db.fans.find().forEach(function(doc) {
    var artists = [];
    db.artists.find({ fans: doc._id }).forEach(function(a) {
        artists.push(a._id);
    });

    db.fans.update({ _id: doc._id }, { $set: { "fan_of_artist": artists } }, { multi: false });
    print("Updated fan: " + doc._id);
});

db.artists.find().forEach(function(doc) {
    var artists = [];
    db.artists.find({ fans_a: doc._id }).forEach(function(a) {
        artists.push(a._id);
    });
    db.artists.update({ _id: doc._id }, { $set: { "fan_of_artist": artists } }, { multi: false });
    print("Updated artist: " + doc._id);
});

print("Done");
