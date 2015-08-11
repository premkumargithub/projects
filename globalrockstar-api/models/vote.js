'use strict';
/**
 *   @module Model:Vote
 *   @description This module is used for providing database interation and schema management to Vote model
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 *   @requires module:q
 *   @requires module:./chart_entry
 *   @requires module:./song
 *   @requires module:../lib/get-current-contest
 *   @requires module:../config
 *   @requires module:node-redis-pubsub
 *   @requires module:../lib/fan-vote-helper
 *   @requires module:lodash
 **/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps'),
    Q = require('q'),
    ChartEntry = require('./chart_entry'),
    Song = require('./song'),
    currentContest = require('../lib/get-current-contest'),
    config = require('../config'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp(config.redis),
    fanVoteHelper = require('../lib/fan-vote-helper'),
    lodash = require('lodash');

/**
 * @namespace
 * @name Model:vote.schemaDef
 * @desc Create the schema schemaDef for Vote table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var schemaDef = {
    platform: {
        type: String,
        enum: ['android', 'ios', 'desktop'],
        required: true
    },
    subPlatform: {
        type: String
    },
    type: {
        type: String,
        enum: ['wildcard', 'facebook', 'twitter', 'purchase', 'dummy', 'bonus', 'fan']
    },
    song: {
        type: Schema.Types.ObjectId,
        ref: 'Song',
        required: true,
        index: true
    },
    artist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
        required: true,
        index: true
    },
    voter_artist: {
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    },
    voter_fan: {
        type: Schema.Types.ObjectId,
        ref: 'Fan'
    },
    day: {
        type: Date
    },
    series_vote: {
        type: Boolean
    },
    contest: {
        type: Schema.Types.ObjectId,
        ref: 'Contest'
    },
    phase: {
        type: String,
        enum: lodash.without(config.phases, 'cfe')
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'failed', 'dummy']
    },
    voucher: {
        type: Schema.Types.ObjectId,
        ref: 'voucher'
    }
};

var Vote = new Schema(schemaDef);

Vote.index({
    song: 1,
    type: 1,
    day: 1,
    voter_fan: 1,
    voter_artist: 1,
    series_vote: 1
}, {
    unique: true
});

Vote.path('status').set(function (val) {
    if (this.status !== 'pending' && !this.isNew) {
        this.invalidate('status', 'can not change status if it is not pending');
        return this.status;
    }
    return val;
});


Vote.statics.updateChartEntry = function (vote) {

    if (process.env.NODE_ENV === 'test') {
        return;
    }

    if (vote.status != 'processed') {
        return;
    }

    var currentPhase = null;

    currentContest().then(function (contest) {
        if (!contest) {
            console.warn('No contest found');
            return;
        }

        currentPhase = vote.phase || contest.currentPhase.slice(-1)[0];

        // var increment = [{votes: 1}, {}];

        var increment = {votes: 1};
        increment["voteTypes." + vote.type] = 1;
        increment["voteTypes." + vote.platform] = 1;

        if (vote.type == 'wildcard') {
            console.log(increment);
        }


        if (vote.series_vote) {
            increment["voteTypes.serie"] = 1;
        }

        return Q.ninvoke(ChartEntry, 'findOneAndUpdate', {
            contest: contest._id,
            song: vote.song,
            phase: currentPhase
        }, {
            $inc: increment /*,
             $push: { voteRefs: vote._id } */
        });

    }).then(function (entry) {
        unagi.enqueue('charts:update', {
            phase: currentPhase,
            country: entry.country
        });
    }).fail(function (err) {
        console.log(err);
    });
};

Vote.pre('save', function (next) {
    if (!this.series_vote && !this.day) {
        var today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        this.day = today;
    }

    if (this.isNew && this.isPurchase()) {
        this.status = 'pending';
    }

    if ((this.platform !== 'desktop' || this.voucher) && this.isPurchase()) {
        this.status = 'processed';
    }

    if (this.type === 'twitter' || this.type === 'facebook') {
        this.status = 'processed';
    }

    if (this.type == 'dummy') {
        this.status = 'dummy';
    }

    if (this.series_vote) {
        this.status = 'processed';
    }

    next();
});

Vote.pre('save', function (next) {
    if (this.type == 'purchase' && this.status == 'processed') {
        unagi.enqueue('votes:new-purchase', {
            song: this.song,
            userId: this.voter_artist || this.voter_fan,
            userType: this.voter_artist ? 'artist' : 'fan',
            artist: this.artist,
            contest: this.contest
        });
    }

    next();
});

Vote.pre('save', function (next) {
    this._wasNew = this.isNew;
    this._processedPurchase = this.modifiedPaths().indexOf('status') !== -1 && this.type == 'purchase';

    next();
});

Vote.pre('validate', function (next) {
    if (!this.isNew) {
        return next();
    }

    var self = this;

    currentContest().then(function (contest) {
        self.contest = contest;
        if (!self.phase) {
            self.phase = contest.currentPhase[contest.currentPhase.length - 1];
            if (['bonus', 'wildcard'].indexOf(self.type) !== -1 && self.phase === 'pause') {
                self.phase = contest.previousPhase[0];
            }
        }

        next();
    }).fail(function (err) {
        console.error(err);
        console.error(err.stack);
        next(err);
    });


});

Vote.virtual('voter')
    .get(function () {
        return this.voter_artist || this.voter_fan;
    });


Vote.virtual('attrAccessible')
    .get(function () {
        return ['song', 'artist', 'voter_artist', 'voter_fan', 'type', 'platform', 'status'];
    });


Vote.post('save', function () {
    //    console.log('post-save');
    if (this.status === 'pending') {
        return;
    }
    //    console.log('post-save-1');
    if (!this._wasNew && !this._processedPurchase) {
        return;
    }
    //    console.log('post-save-2');

    this.model('Vote').updateChartEntry(this);

    unagi.fire('songs:votes:created:activity', {
        songId: this.song,
        state: this.status,
        fanId: this.voter_artist || this.voter_fan,
        fanType: this.voter_artist ? 'artists' : 'fans',
        type: this.type,
        createdAt: this.createdAt,
        day: this.day,
        artistId: this.artist,
        platform: this.platform,
        isSerie: this.series_vote,
        isVoucher: this.isVoucher
    });

    unagi.fire('artist:votes:add', {
        fanId: this.voter_artist || this.voter_fan,
        fanType: this.voter_artist ? 'artist' : 'fan',
        artistId: this.artist,
        type: this.type,
        platform: this.platform,
        isSerie: this.series_vote,
        contest: this.contest,
        phase: this.phase
    });
});

Vote.plugin(timestamps, {
    index: true
});

Vote.methods.isPurchase = function () {
    return this.type == 'purchase';
};

function threeDaysBefore(date) {
    var threeDaysAgo = new Date(date);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return threeDaysAgo;
}

Vote.statics.checkForVotingSerie = function (vote) {
    if (vote.type !== 'purchase') {
        return Q.resolve(false);
    }
    if (vote.status !== 'processed') {
        return Q.resolve(false);
    }

    console.log('vote:checkforserie:%s', vote._id);

    var self = this;
    return Q.ninvoke(self, 'find', {
        song: vote.song,
        type: 'purchase',
        status: 'processed',
        day: {
            $lt: vote.day,
            $gt: threeDaysBefore(vote.day)
        },
        voter_fan: vote.voter_fan,
        voter_artist: vote.voter_artist
    }).then(function (votes) {
        if (lodash.filter(votes, 'series_vote').length > 0) {
            return Q.resolve(false);
        }
        return Q.resolve(votes.length + 1);
    }).fail(console.error.bind(console));
};

function subtractOneDay(date) {
    date = new Date(date);
    date.setDate(date.getDate() - 1);
    return date;
}


Vote.statics.createFanVoteForArtist = function (artist, votee_type, votee_id) {

    var contest = null;
    var phase = null;
    var dfd = Q.defer();

    var self = this;


    return currentContest()
        .then(function (_contest) {
            contest = _contest;
            phase = contest.theReallyCurrentPhase().slice(-1)[0];

            return Q.ninvoke(Song, 'findOne', {artist: artist._id, contest: contest._id, state: 'active'});
        })
        .then(function (nominatedSong) {


            if (!nominatedSong) {
                console.log("no nominated song found for current contest");
                return {};
            }


            console.log(nominatedSong.title);

            var voteTemplate = {
                song: nominatedSong._id,
                phase: phase,
                contest: contest._id,
                artist: artist._id,
                platform: 'desktop',
                type: 'fan',
                day: new Date(),
                status: 'processed'
            };

            console.log(voteTemplate);

            voteTemplate[votee_type == 'artist' ? 'voter_artist' : 'voter_fan'] = votee_id;

            var vote = new self(voteTemplate);

            console.log(vote);

            return Q.ninvoke(vote, 'save');
        })
        .then(function (createdVote) {
            console.log(createdVote);
            dfd.resolve(createdVote);
        })
        .fail(function (err) {
            console.log(err.stack);
            return dfd.reject(err);
        });

    // return dfd.promise;

};


Vote.statics.payloadFanForPhase = function (song, votee_type, votee_id, phase) {
    var self = this;
    var template = {
        platform: 'desktop',
        type: 'fan',
        song: song,
        artist: song.artist,
        status: 'processed',
        phase: phase,
        day: new Date()
    };

    template[votee_type == 'artists' ? 'voter_artist' : 'voter_fan'] = votee_id;

    return template;

};

Vote.statics.payloadWildcardForPhase = function (song, artist, phase) {
    var self = this;
    var template = {
        platform: 'desktop',
        type: 'wildcard',
        song: song,
        artist: artist,
        phase: phase,
        status: 'processed',
        voter_artist: mongoose.Types.ObjectId(),
        day: new Date()
    };
    return template;
};

Vote.statics.payloadBonusForPhase = function (song, artist, phase) {
    var self = this;
    var template = {
        platform: 'desktop',
        type: 'bonus',
        song: song,
        artist: artist,
        phase: phase,
        status: 'processed',
        voter_artist: mongoose.Types.ObjectId(),
        day: new Date()
    };
    return template;
};

Vote.statics.createBonusForPhase = function (song, artist, phase) {

    var self = this;
    var template = self.payloadBonusForPhase(song, artist, phase);
    var bonusVote = new self(template);

    return bonusVote;

    //Q.ninvoke(bonusVote, 'save').fail(console.log);

};

Vote.statics.createSerie = function (vote) {
    var self = this;
    console.log('vote:create-serie:%s', vote._id);

    var template = {
        platform: vote.platform,
        type: vote.type,
        song: vote.song,
        artist: vote.artist,
        voter_artist: vote.voter_artist,
        voter_fan: vote.voter_fan,
        day: vote.day,
        series_vote: true
    };

    var todaysAdditionalVote = new self(template);

    template.day = subtractOneDay(template.day);
    var yesterdaysAdditionalVote = new self(template);

    template.day = subtractOneDay(template.day);
    var twoDaysAgoAdditionalVote = new self(template);

    Q.ninvoke(todaysAdditionalVote, 'save').fail(console.error);
    Q.ninvoke(yesterdaysAdditionalVote, 'save').fail(console.error);
    Q.ninvoke(twoDaysAgoAdditionalVote, 'save').fail(console.error);

    unagi.fire('songs:votes:serie', {
        artist: vote.artist,
        voter: vote.voter_artist || vote.voter_fan,
        voter_type: vote.voter_artist ? 'artist' : 'fan',
        song: vote.song,
        createdAt: new Date()
    });
};

module.exports = mongoose.model('Vote', Vote);
module.exports.schemaDef = schemaDef;
