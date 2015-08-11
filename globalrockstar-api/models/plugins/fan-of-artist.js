'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Q = require('q');

module.exports = function fanOfArtist(schema, options) {

    schema.add({
        fan_of_artist: [{
            type: Schema.Types.ObjectId,
            ref: 'Artist'
        }]
    });

    /**
    *   @function
    *   @desc This function is used to store the id of the artist in the
    *   user record that became the fan of that artist
    **/
    schema.methods.becameFanOf = function (artistId) {
        var dfd = Q.defer();
        // Here this belog to the fan
        var id = this._id;
        var self = this;

        if (id === artistId) {
            dfd.reject(new Error('You cannot be your own fan'));
        }
        // get the detail of the artist of which the user became a fan
        Q.ninvoke(mongoose.model("Artist").findOne({
            _id: artistId
        }), 'exec')
            .then(function (artist) {
                if (!artist) {
                    return dfd.reject(new Error('No Artist found by id: ' + artistId));
                }
                // Update the user record by entring the id of the artist in the fan_of_artist
                return Q.ninvoke(self.constructor.findOneAndUpdate({
                    // Adding the And condition to get the user by matching the id and also
                    // check if user is already a fan of the artist
                    $and: [{_id: id},
                        {fan_of_artist: {$ne: artistId}}
                    ]
                },// push syntax of mongodb to store the artist id in the fan_of_artist key
                // of the fan record
                {
                    $push: {
                        fan_of_artist: artistId
                    }
                }), 'exec');
            })
            .then(function (updated) {
                dfd.resolve(updated);
            })
            .fail(function (err) {
                console.error(err);
                dfd.reject(err);
            });

        return dfd.promise;
    };
};
