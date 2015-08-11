'use strict';

/**
 * @module Models:contest
 *
 * @description Model representing contests collection on MongoDB
 *
 * @requires module:mongoose
 * @requires module:mongoose-timestamps
 * @requires module:hapi
 * @requires module:lodash
 * @requires module:q
 * @requires module:node-redis-pubsub
 * @requires module:mongoose-slugify
 * @requires module:../config
 * @requires module:./time-range
 * @requires module:../lib/model-mapper
 */
var mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamps'),
    Hapi = require('hapi'),
    _ = require('lodash'),
    Q = require('q'),
    nrp = require('node-redis-pubsub'),
    slugify = require('mongoose-slugify'),
    config = require('../config'),
    TimeRange = require('./time-range.js'),
    mapFields = require('../lib/model-mapper').mapFields,
    unagi = new nrp(config.redis),
    Schema = mongoose.Schema;

var schemaOptions = {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
};

// ContestSchema schema.
var ContestSchema = new Schema({
    name: String,
    contestTicker: Boolean,
    cfe: {
        webisodeNumber: String,
        webisodeTitle: String,
        youtubeUrl: String,
        time: TimeRange,
        content: String
    },
    np: {
        webisodeNumber: String,
        webisodeTitle: String,
        content: String,
        youtubeUrl: String,
        time: TimeRange
    },
    globalfinalsQualification: {
        time: TimeRange,
        content: String,
        webisodeNumber: String,
        webisodeTitle: String,
        youtubeUrl: String
    },
    globalfinalsBest64: {
        time: TimeRange,
        content: String,
        webisodeNumber: String,
        webisodeTitle: String,
        youtubeUrl: String
    },
    globalfinalsBest16: {
        time: TimeRange,
        content: String,
        webisodeNumber: String,
        webisodeTitle: String,
        youtubeUrl: String
    },
    finals: {
        content: String,
        webisodeNumber: String,
        youtubeUrl: String,
        webisodeTitle: String,
        time: TimeRange
    },
    charts: {
        updated: Date,
        entries: [String]
    }
}, schemaOptions);

// Add slugify plugin
ContestSchema.plugin(slugify, {
    position: 'pre',
    lowercase: true,
    softdelete: false,
    index: true,
    prop: 'name',
    slugField: 'slug'
});

// Add slugify timestamps
ContestSchema.plugin(timestamps, {index: true});

// Set virtual attribute not persisted on MongoDB
ContestSchema.virtual('attrAccessible')
    .get(function () {
        return ['name', 'cfe', 'np', 'content', 'webisodeNumber', 'webisodeTitle', 'youtubeUrl', 'contestTicker',
            'globalfinalsQualification', 'globalfinalsBest64', 'globalfinalsBest16', 'finals'];
    });

ContestSchema.set('toObject', {virtuals: true});

// Mongoose middleware to download the video associated to a specific contest phase (before updating
// the document) if it has been modified
ContestSchema.pre('save', function (next) {
    var self = this;
    var arr = ['cfe', 'np', 'globalfinalsQualification', 'globalfinalsBest64', 'globalfinalsBest16'];

    arr.forEach(function (phase) {
        if (self.isModified(self[phase].youtubeUrl)) {
            unagi.enqueue('worker:download:video', self[phase]);
        }
    });

    next();
});

// Set virtual attribute referring to the current phase (not persisted on MongoDB)
/**
 *   @function
 *   @name Models:contest.currentPhase
 *   @desc In this function we check in which phase the contest is
 *   by comparing the start and end date of the contest
 **/
ContestSchema.virtual('currentPhase')
    .get(function () {
        var self = this;
        // today date
        var now = new Date();
        //Use lodash to iterate through all the phase of the contest
        var cPhases = _.select(this.phases(), function (phaseId) {
            return self.get(phaseId) &&
                self.get(phaseId).time &&
                self.get(phaseId).time.end >= now &&
                self.get(phaseId).time.start <= now;
        });
        if (!cPhases.length && self.get('cfe').time.start <= now && self.get('globalfinalsBest16').time.end >= now) {
            cPhases = ['pause'];
        }

        if (!cPhases.length && self.get('globalfinalsBest16').time.end <= now) {
            cPhases = ['finals'];
        }

        return cPhases;
    });

// Return all phases
ContestSchema.methods.phases = function () {
    return config.phases;
    //return ['cfe', 'np', 'globalfinalsQualification', 'globalfinalsBest64', 'globalfinalsBest16'];
};

// Set virtual attribute referring to the previous phase (not persisted on MongoDB)
ContestSchema.virtual('previousPhase')
    .get(function () {
        var now = new Date();
        var self = this;
        var currentPhase = this.currentPhase.length > 0 ? this.currentPhase[0] : '';
        if (currentPhase === 'pause') {
            var ph = _.select(self.phases(), function (phaseId) {
                return self.get(phaseId) &&
                    self.get(phaseId).time &&
                    self.get(phaseId).time.end < now;
            });
            return ph.length ? [ph.splice(-1)[0]] : [];
        }

        var idx = this.phases().indexOf(currentPhase);
        if (idx > this.phases().length || idx <= 0) {
            return [];
        }
        return [this.phases()[idx - 1]];
    });

// Set virtual attribute referring to the next phase (not persisted on MongoDB)
ContestSchema.virtual('nextPhase')
    .get(function () {
        var now = new Date();
        var self = this;
        var currentPhase = this.currentPhase.length > 0 ? this.currentPhase.slice(-1)[0] : '';

        if (currentPhase === 'globalfinalsBest16') {
            return ['finals'];
        }

        if (currentPhase === 'pause') {
            var ph = _.select(self.phases(), function (phaseId) {
                return self.get(phaseId) && self.get(phaseId).time && self.get(phaseId).time.start > now;
            });
            return ph.length ? [ph[0]] : [];
        }

        var idx = this.phases().indexOf(currentPhase);
        if (idx >= this.phases().length - 1 || idx < 0) {
            return [];
        }
        return [this.phases()[idx + 1]];
    });

// Set virtual attribute referring to the current state of arena (not persisted on MongoDB)
ContestSchema.virtual('arenaLocked')
    .get(function () {
        return this.phases().indexOf(this.currentPhase.slice(-1)[0]) > 1;
    });

// Update safely only the updatable fields
ContestSchema.methods.safeUpdate = function (props, type) {
    var self = this;
    mapFields(this, props, self.attrAccessible, ContestSchema);
    return Q.ninvoke(self, 'save');
};

// Check which phase is running right now (from start to best 16)
ContestSchema.statics.running = function (cb) {
    var query = {
        'cfe.time.start': {$lte: new Date()},
        'globalfinalsBest16.time.end': {$gte: new Date()}
    };

    this.find(query).sort({'cfe.time.start': 1}).exec(function (err, contests) {
        return cb(err, contests);
    });
};

// Check id contest is in cfe phase
ContestSchema.statics.inCfe = function (cb) {
    var query = {
        'cfe.time.start': {$lte: new Date()},
        'cfe.time.end': {$gte: new Date()}
    };

    this.findOne(query, function (err, contest) {
        return cb(err, contest);
    });
};

/**
 *   @fuction
 *   @name Models:contest.current
 *   @desc This function is used to get the current contest
 *   @param {callback}cb - callback function
 **/
ContestSchema.statics.current = function (cb) {

    // Query to find current contest using today date
    var query = {
        'np.time.start': {$lte: new Date()},
        'globalfinalsQualification.time.end': {$gte: new Date()}
    };

    var self = this;
    // Get all the currently running  contest
    // TODO has to be change after 2015 contest
    this.find(query).sort({'np.time.start': 1}).exec(function (err, contest) {
        if (err) {
            return cb(err);
        }
        if (!contest || contest === undefined) {
            return cb(null, []);
        }
        return cb(null, contest);

        // This functionality should be in other function
        // to get the previous contest
        /*return self.preNow(function (err, pres) {
         if (err) {
         return cb(err);
         }
         return cb(null, pres[0]);
         });*/
    });
};

// Get all previous contests
ContestSchema.statics.preNow = function (cb) {
    var query = {
        'cfe.time.start': {$lte: new Date()}
    };

    this.find(query).sort({'cfe.time.start': -1}).exec(cb);
};

// Get the previous contest
ContestSchema.statics.previous = function (cb) {
    var self = this;

    this.current(function (err, contest) {
        if (err) {
            return cb(err);
        }
        if (!contest) {
            return cb(null, []);
        }
        // if there is no current contest then it return blank array
        if (!contest.length) {
            var query = {
                'globalfinalsQualification.time.end': {
                    $lte: new Date()
                }
            };
        } else {
            var query = {
                '_id': {
                    // Todo change after 2015 contest
                    $ne: contest[0]._id
                },
                'globalfinalsQualification.time.end': {
                    // Todo change after 2015 contest
                    $lte: contest[0].np.time.start
                }
            };
        }
        return self.findOne(query).sort({'cfe.time.start': -1}).exec(function (err, res) {
            if (err) {
                return cb(err);
            }
            cb(null, res);
        });
    });

};

// Get the next contest
/**
 *   @function
 *   @name Models:contest.next
 *   @desc This is the chain function which is used to get the
 *   next contest detail
 *   @param {callback}cb - callback function
 **/
ContestSchema.statics.next = function (cb) {
    // this here is the contest schema
    var self = this;

    //Old code
    /*self.current(function (err, contest) {
     if (err) {
     return cb(err);
     }
     if (!contest) {
     return cb(Hapi.error.notFound());
     }
     return self.findOne({'cfe.time.start': {$gt: contest.cfe.time.end}}).exec(cb);
     });*/

    //Query to find all the contest that are started in the future
    // return the array of contest if there is any contest
    // else return blank array
    // TODO
    // Can be change in the future
    // depend on the changes in the schema
    self.find({
        'cfe.time.end': {$gt: new Date()}
    }).exec(function (err, contests) {
        if (err) {
            // return err if we get error in the query
            return cb(err);
        }
        if (!contests) {
            // return error not found if there is no contest
            return cb([]);
        }
        // if there is no current contest then it return blank array
        if (!contests.length) {
            return cb([]);
        }
        // return the contest array by using the callback
        cb(null, contests);
    });
};

/**
 * theReallyCurrentPhase
 *
 * @returns the previous phase if contest is in pause or finals
 * if np and cfe is running it only returns np
 */
ContestSchema.methods.theReallyCurrentPhase = function () {
    var phase = this.currentPhase.slice(-1);
    if (['pause', 'finals'].indexOf(phase[0]) !== -1) {
        phase = this.previousPhase;
    }
    return phase;
};

module.exports = mongoose.model('Contest', ContestSchema);
