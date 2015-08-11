'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    Artist = mongoose.model('Artist'),
    _ = require('lodash');

function artistFactory() {
    return new Artist({
        _id: ObjectId(),
        provider: 'local',
        name: 'Fake Artist',
        email: ObjectId().toString() + 'projecttest@test.com',
        password: 'password123456',
        password_confirmation: 'password123456',
        toc: true,
        newsletter: true,
        country: 'AT',
        paypal_email: ObjectId().toString() + 'projecttest@test.com',
        paypal_currency: 'USD'
    });
}

function validArtist() {
    return new Q(artistFactory());
}

function savedArtist(cb) {
    var artist;
    return validArtist()
        .then(function(a) {
            artist = a;
            return Q.ninvoke(artist, 'save');
        })
        .then(function () {
            return Q.ninvoke(Artist.findOne({
                _id: artist._id
            }), 'exec');
        }).nodeify(cb);
}

module.exports = {
    validArtist: validArtist,
    savedArtist: savedArtist
};
