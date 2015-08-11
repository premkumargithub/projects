"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps'),
    slugify = require('mongoose-slugify'),
    Q = require('q'),
    _ = require('lodash'),
    mapFields = require('../lib/model-mapper').mapFields,
    emitter = require('../lib/event-emitter'),
    currentContest = require('../lib/get-current-contest'),
    ChartEntry = require('./chart_entry'),
    config = require('../config'),
    states = require('../public/configs/states.json'),
    StateHistory = require('./state-history'),
    Contest = require('../models/contest');

// Basic song schema
var SongSchema = new Schema({

    ////// MANDATORY FIELDS //////

    title: {type: String, index: true},
    genres: Array,

    // Artist reference to artist's model is mandatory, every song should have an artist
    artist: {type: Schema.Types.ObjectId, ref: 'Artist', index: true},

    // Order of this song
    order: Number,

    ////// NOT MANDATORY FIELDS //////

    // Price of the song
    price: Number,

    // Audio is stored on amazon, it has its own name based on amazon id
    audiofile: String,

    image: String,

    // Version 2 is for documents created starting from the 2015
    gr_doc_ver: Number,

    // Album in which the song is eventually contained
    album: {type: Schema.Types.ObjectId, ref: 'Album'},

    // Video eventually associated to the song
    video: {type: Schema.Types.ObjectId, ref: 'Video'},

    // Contest associated to this song
    contest: {type: Schema.Types.ObjectId, ref: 'Contest'},

    copyright_lyrics: String,
    copyright_music: String,
    copyright_publisher: String,

    description: String,
    lyrics: String,

    label: String,
    upcCode: String,
    ISRC: String,
    publisher: String,

    // Legacy data from previous contests
    legacy: {type: Schema.Types.Mixed},

    // Info about song's moderation
    flagged: Boolean,
    flagged_date: Date,
    flagged_reason: String,

    stars: {type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0},

    plays: {type: Number, default: 0},
    realPlays: {type: Number, default: 0},

    // Current State of the song (see states array)
    state: {index: true, type: String, enum: states},

    // History of states' changes
    stateHistory: [StateHistory]
});

SongSchema.index({artist: 1}, {unique: true});

// Slugify song's title
SongSchema.plugin(slugify, {
    position: "pre",
    lowercase: false,
    softdelete: true,
    index: true,
    prop: 'title',
    slugField: 'slug'
});

// Create and update timestamps fields "createdOn" and "modifiedOn"
SongSchema.plugin(timestamps, {
    index: true
});

// Emit an event every time state *changes to* active, inactive or deleted
SongSchema.path('state', {
    set: function (value) {
        if (value === 'active' || value === 'inactive' || value === 'deleted') {
            // Emit a statechange event if song's state changes
            emitter.emit('song:statechange', this, value);
        }
        return value;
    }
});


// TODO: Not sure if we still need this
SongSchema.methods.songMeta = function () {

    var self = this;

    var payload = [{
        $match: {
            // status: 'processed',
            // type: { $ne: 'dummy' },
            song: self._id
        }
    }, {
        $sort: {
            phase: -1
        }
    }, {
        $group: {
            _id: '$contest',
            votes: {
                $last: '$votes'
            },

            np: {
                $sum: {
                    $cond: [{
                        $eq: ["$phase", 'np']
                    }, '$votes', 0]
                }
            },
            globalfinalsQualification: {
                $sum: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsQualification']
                    }, '$votes', 0]
                }
            },
            globalfinalsBest64: {
                $sum: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest64']
                    }, '$votes', 0]
                }
            },
            globalfinalsBest16: {
                $sum: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest16']
                    }, '$votes', 0]
                }
            },

            posNp: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'np']
                    }, '$pos', 0]
                }
            },
            posGlobalfinalsQualification: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsQualification']
                    }, '$pos', 0]
                }
            },
            posGlobalfinalsBest64: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest64']
                    }, '$pos', 0]
                }
            },
            posGlobalfinalsBest16: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest16']
                    }, '$pos', 0]
                }
            },

            nPosNp: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'np']
                    }, '$nPos', 0]
                }
            },
            nPosGlobalfinalsQualification: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsQualification']
                    }, '$nPos', 0]
                }
            },
            nPosGlobalfinalsBest64: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest64']
                    }, '$nPos', 0]
                }
            },
            nPosGlobalfinalsBest16: {
                $first: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest16']
                    }, '$nPos', 0]
                }
            },

            voteTypesNp: {
                $push: {
                    $cond: [{
                        $eq: ["$phase", 'np']
                    }, '$voteTypes', null]
                }
            },
            voteTypesGlobalfinalsQualification: {
                $push: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsQualification']
                    }, '$voteTypes', null]
                }
            },
            voteTypesGlobalfinalsBest64: {
                $push: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest64']
                    }, '$voteTypes', null]
                }
            },
            voteTypesGlobalfinalsBest16: {
                $push: {
                    $cond: [{
                        $eq: ["$phase", 'globalfinalsBest16']
                    }, '$voteTypes', null]
                }
            },

            phases: {
                $push: '$phase'
            },
            lastPhase: {
                $last: '$phase'
            },
            song: {
                $first: '$song'
            },
            pos: {
                $last: '$pos'
            },
            nPos: {
                $last: '$nPos'
            },
            voteTypes: {
                $last: '$voteTypes'
            },
            credits_dollar: {
                $sum: {
                    $multiply: ["$voteTypes.purchase", config.payment.paidVotePrice.USD.artist]
                }
            }
        }
    }, {
        $project: {
            _id: 1,
            votes: 1,
            pos: 1,
            nPos: 1,
            song: 1,
            credits_dollar: 1,
            lastPhase: 1,
            phases: 1,
            voteTypes: 1,
            phasesMeta: {
                np: {
                    votes: '$np',
                    pos: '$posNp',
                    nPos: '$nPosNp',
                    voteTypes: '$voteTypesNp'
                },
                globalfinalsQualification: {
                    votes: '$globalfinalsQualification',
                    pos: '$posGlobalfinalsQualification',
                    nPos: '$nPosGlobalfinalsQualification',
                    voteTypes: '$voteTypesGlobalfinalsQualification'
                },
                globalfinalsBest64: {
                    votes: '$globalfinalsBest64',
                    pos: '$posGlobalfinalsBest64',
                    nPos: '$nPosGlobalfinalsBest64',
                    voteTypes: '$voteTypesGlobalfinalsBest64'
                },
                globalfinalsBest16: {
                    votes: '$globalfinalsBest16',
                    pos: '$posGlobalfinalsBest16',
                    nPos: '$nPosGlobalfinalsBest16',
                    voteTypes: '$voteTypesGlobalfinalsBest16'
                }
            }
        }
    }];

    var dfd = Q.defer();

    Q.all([
        currentContest(),
        Q.ninvoke(ChartEntry, 'aggregate', payload)
    ])
        .spread(function (_contest, chartEntries) {
            Contest.populate(chartEntries, [{
                path: 'song',
                select: 'plays',
                model: 'Song'
            }, {
                path: '_id',
                select: 'name _id',
                model: 'Contest'
            }], function (err, res) {
                var result = res.map(function (entry) {
                    entry.plays = entry.song.plays;
                    entry.contest = {
                        name: entry._id.name,
                        _id: entry._id._id
                    };

                    entry.stillRunning = (entry.contest._id.toString() == _contest._id.toString()) && (entry.phases.indexOf(_contest.currentPhase.slice(-1)[0]) !== -1);

                    if (entry.voteTypes && entry.voteTypes.purchase) {
                        if (entry.voteTypes.serie) {
                            entry.voteTypes.purchase -= entry.voteTypes.serie;
                        }
                        // entry.credits_dollar = entry.credits_euro = entry.voteTypes.purchase * config.payment.paidVotePrice.USD.artist;
                    }


                    entry.phasesMeta = _.map(entry.phasesMeta, function (val, key) {
                        val.voteTypes = _.compact(val.voteTypes)[0] || 0;
                        if (val.voteTypes && val.voteTypes.purchase) {
                            if (val.voteTypes.serie) {
                                val.voteTypes.purchase -= val.voteTypes.serie;
                            }
                            val.credits_dollar = val.credits_euro = val.voteTypes.purchase * config.payment.paidVotePrice.USD.artist;
                        } else {
                            val.credits_dollar = val.credits_euro = 0.0;
                        }
                        val.name = key;
                        return val;
                    });


                    entry.credits_dollar = entry.credits_euro = entry.phasesMeta[0].credits_dollar || 0;

                    var gfPhases = entry.phasesMeta.slice(1).filter(function (el) {
                        return el.credits_dollar > 0;
                    });
                    if (gfPhases.length) {
                        entry.credits_dollar = entry.credits_euro += gfPhases.slice(-1)[0].credits_dollar;
                    }

                    delete entry.song;
                    delete entry._id;
                    return entry;
                });
                dfd.resolve(result);
                // var result = res.map( function(entry) {
                //     entry.votes = entry[ entry.lastPhase ] ;
                //     entry.plays = entry.song.plays ;
                //     entry.name = entry._id.name ;
                //     entry.id = entry._id._id ;
                // } ) ;
            });
        })
        .fail(function (err) {
            dfd.reject(err);
        });

    return dfd.promise;

};

// TODO: Not sure if we still need this
SongSchema.methods.contestMeta = function () {

    var dfd = Q.defer();
    var self = this;
    Q.all([
        currentContest(),
        Q.ninvoke(ChartEntry, 'find', {
            song: self._id
        })
        //            currentChartEntries(0, null, false, { song: song._id }, true )
    ]).spread(function (contest, chartEntries) {
        if (!chartEntries.length) {
            dfd.resolve({});
        }

        var allPurchaseVotes = _.reduce(chartEntries, function (sum, entry) {
            return sum + (entry.voteTypes.purchase || 0);
        }, 0);
        var chartMeta = _.chain(chartEntries).map(function (entry) {
            return {
                position: entry.pos,
                nPosition: entry.nPos,
                votes: entry.votes,
                phase: entry.phase,
                credits: {
                    dollar: config.payment.paidVotePrice.USD.artist * allPurchaseVotes
                }
            };
        }).sortBy(function (entry) {
            var index = _.indexOf(config.phases, entry.phase);
            return index === -1 ? config.phases.length : index;
        }).value();

        var phases = _.pluck(chartMeta, 'phase');

        var contest_meta = {
            charts: chartMeta
        };

        if (phases.length) {
            contest_meta.stillRunning = _.intersection(phases, contest.currentPhase).length > 0;
            contest_meta.phases = phases;
            contest_meta.lastPhase = phases.slice(-1)[0];
        }

        dfd.resolve(contest_meta);
    }).fail(function (err) {
        dfd.reject(err);
    });

    return dfd.promise;

};

// Fields updateable from admin and from frontend users
var updateableFields = {
    profile: ['audiofile', 'title', 'tags', 'description', 'lyrics', 'spotifyUrl', 'itunesUrl', 'sponsoring',
        'reward', 'contest', 'flagged_date', 'flagged', 'flagged_reason', 'flagged_date', 'copyright_lyrics',
        'copyright_music', 'copyright_publisher', 'genres', 'order', 'realPlays'
    ],
    admin: ['youtube', 'audiofile', 'stars', 'title', 'tags', 'description', 'lyrics', 'spotifyUrl', 'itunesUrl',
        'sponsoring', 'reward', 'artist', 'state', 'contest', 'flagged', 'flagged_reason', 'flagged_date',
        'copyright_lyrics', 'copyright_music', 'copyright_publisher', 'genres', 'order', 'realPlays', 'plays'
    ]
};

// Safely update the model (see updateableFields above)
SongSchema.methods.safeUpdate = function (props, type) {
    var self = this;
    mapFields(this, props, updateableFields[type], SongSchema);
    return Q.ninvoke(self, 'save');
};

module.exports = mongoose.model('Song', SongSchema);