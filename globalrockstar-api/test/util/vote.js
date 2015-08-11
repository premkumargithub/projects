'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    Vote = mongoose.model('Vote'),
    Artist = mongoose.model('Artist'),
    Fan = mongoose.model('Fan'),
    Song = mongoose.model('Song'),
    songUtil = require('../util/song'),
    artistUtil = require('../util/artist'),
    fanUtil = require('../util/fan'),
    contestUtil = require('../util/contest'),
    _ = require('lodash');

function voteFactory() {
    return new Vote({
        _id: ObjectId(),
        platform: 'ios',
        referer: {
            platform: 'facebook',
            url: 'http://www.facebook.com'
        },
        status: 'pending',
        artist: ObjectId(),
        song: ObjectId(),
        voter_fan: ObjectId()
    });
}

function validVote() {
    return new Q(voteFactory());
}

function savedVote(cb) {
    var dfd = Q.defer();
    var vote;
    var artist;
    var fan;
    var song;

    contestUtil.savedContest()
        .then(function () {
            return Q.all([
                songUtil.savedSong(),
                artistUtil.savedArtist(),
                fanUtil.savedFan(),
                validVote()
            ]);
        }).spread(function (s, a, f, v) {
            song = s;
            artist = a;
            fan = f;
            vote = v;
            vote.artist = artist._id;
            vote.song = song._id;
            vote.voter_fan = fan._id;
            return Q.ninvoke(vote, 'save');
        })
        .then(function () {

            return Q.ninvoke(Vote.findOne({
                _id: vote._id
            }), 'exec');
        })
        .then(function (v) {
            if (!v) {
                return dfd.reject('ERROR: no vote saved!');
            }
            dfd.resolve(v);
        })

    .fail(function (error) {
        console.error(error);
        dfd.reject(error);
    })

    .nodeify(cb);

    return dfd.promise;
}

module.exports = {
    validVote: validVote,
    savedVote: savedVote,
};
