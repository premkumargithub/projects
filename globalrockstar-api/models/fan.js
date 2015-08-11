"use strict";
/**
 * @module Models:fan
 *
 * @description Model representing fans collection on MongoDB, intended to store and retrieve information about fans
 *
 * @requires module:mongoose
 * @requires module:lodash
 * @requires module:slug
 * @requires module:mongoose-slugify
 * @requires module:validator
 * @requires module:q
 * @requires module:node-uuid
 * @requires module:passport-local-mongoose
 * @requires module:mongoose-timestamps
 * @requires module:node-redis-pubsub
 * @requires module:../lib/model-mapper
 * @requires module:./state-history
 * @requires module:./plugins/fan-of-artist
 * @requires module:../public/configs/currencies
 * @requires module:../lib/event-emitter
 * @requires module:../config
 *
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    slug = require('slug'),
    slugify = require('mongoose-slugify'),
    validator = require('validator'),
    Q = require('q'),
    uuid = require('node-uuid'),
    passportLocalMongoose = require('passport-local-mongoose'),
    timestamps = require('mongoose-timestamps'),
    nrp = require('node-redis-pubsub'),
    mapFields = require('../lib/model-mapper').mapFields,
    StateHistory = require('./state-history'),
    fanOfArtistPlugin = require('./plugins/fan-of-artist'),
    currencies = require('../public/configs/currencies'),
    emitter = require('../lib/event-emitter'),
    config = require('../config'),
    unagi = new nrp(config.redis),
    Schema = mongoose.Schema;

// Common authentication options
var options = {
    usernameField: 'email',
    saltlen: 32,
    iterations: 1500,
    keylen: 512,
    encoding: 'hex',
    hashField: 'hashedPassword',
    saltField: 'salt',
    incorrectPasswordError: 'Incorrect password',
    incorrectUsernameError: 'Incorrect username',
    missingUsernameError: 'Field %s is not set',
    missingPasswordError: 'Password argument not set!',
    userExistsError: 'User already exists with name %s',
    noSaltValueStoredError: 'Authentication not possible. No salt value stored in mongodb collection!'
};

// ProjectDonation schema. Refers to Project schema
var ProjectDonation = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    dollar: Number
});

// Fan schema. Refers to Song schema
var FanSchema = new Schema({
    firstname: String,
    lastname: String,
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: validator.isEmail
    },
    country: String,
    genres: [String],
    birthdate: Date,
    picture: String,
    newsletter: {
        type: Boolean,
        default: false
    },
    notifications: {
        type: Boolean,
        default: true
    },
    activitystream: {
        type: Boolean,
        default: true
    },
    arena: {
        type: String,
        default: 'video'
    },
    facebookId: {
        type: String,
        index: true
    },
    preferredCountry: {
        type: String,
        //TODO: fix this problem when it will be safe to do it
        /* jshint -W040 */
        Default: this.country
        /* jshint +W040 */
    },
    gender: {
        type: String,
        default: 'prefer_not_to_say',
        enum: ["male", "female", "prefer_not_to_say"]
    },
    verificationToken: {
        type: String,
        unique: true,
        index: true,
        default: function () {
            return uuid.v1();
        }
    },
    verified: Date,
    legacy: {
        type: Schema.Types.Mixed
    },
    state: {
        type: String,
        enum: ['active', 'deleted', 'inactive', 'pending'],
        default: 'pending'
    },
    songs: [{
        type: Schema.Types.ObjectId,
        ref: 'Song'
    }],
    currency: {
        type: String,
        default: 'dollar'
    },
    currentLoginTimestamp: Date,
    lastLoginTimestamp: Date,
    lastLoginIP: String,
    currentLoginIP: String,
    stateHistory: [StateHistory],
    invitationToken: String,
    expenses: {
        projects: [ProjectDonation]
    },
    gr_position: String,
    gr_order: Number
});

// Add timestamps plugin
FanSchema.plugin(timestamps, {
    index: true
});

// Add passport-local-mongoose plugin
FanSchema.plugin(passportLocalMongoose, options);

// Add slugify plugin
FanSchema.plugin(slugify, {
    position: "pre",
    lowercase: false,
    softdelete: true,
    index: true,
    prop: 'name',
    slugField: 'slug'
});

// Add fan of artist plugin
FanSchema.plugin(fanOfArtistPlugin);

// Set virtual attribute not persisted on MongoDB
FanSchema.virtual('name').get(function () {
    return this.firstname + " " + this.lastname;
});

// Set virtual attribute not persisted on MongoDB
FanSchema.virtual('password')
    .get(function () {
        return this._password;
    })
    .set(function (value) {
        this._password = value;
    });

// Set virtual attribute not persisted on MongoDB
FanSchema.virtual("password_confirmation")
    .get(function () {
        return this._password_confirmation;
    })
    .set(function (value) {
        this._password_confirmation = value;
    });

// Set virtual attribute not persisted on MongoDB
FanSchema.virtual('fullname').get(function () {
    return this.firstname + " " + this.lastname;
});

// Set virtual attribute not persisted on MongoDB
FanSchema.virtual('attrAccessible')
    .get(function () {
        return ["firstname", "lastname", "email", "password", "password_confirmation", "state", "verified", "country",
            "gr_position", "gr_order", "genres", "age", "picture", "gender", "preferredCountry", "birthdate"];
    });

// Set virtual attribute not persisted on MongoDB
FanSchema.virtual('userInfo')
    .get(function () {
        return {
            'firstname': this.firstname,
            'lastname': this.lastname,
            'picture': this.picture,
            'country': this.country,
            'gender': this.gender,
            'verificationToken': this.verificationToken,
            'preferredCountry': this.preferredCountry,
            'email': this.email,
            'state': this.state,
            'genres': this.genres,
            'slug': this.slug,
            'verified': this.verified,
            'isComplete': this.isComplete,
            'id': this._id,
            'lastLoginTimestamp': this.lastLoginTimestamp
        };
    });

// Save old state and publish an event if artist's state is inactive or deleted
FanSchema.path('state').set(function (value) {
    if (['inactive', 'deleted'].indexOf(value) >= 0) {
        emitter.emit('fan:statechange', this, value);
    }
    return value;
});


// Validate email
FanSchema.path('email')
    .validate(function (value, respond) {
        var self = this;
        this.constructor.findOne({
            email: value
        }, function (err, user) {
            if (err) {
                throw err;
            }
            if (user) {
                if (self.id == user.id) {
                    return respond(true);
                }
                return respond(false);
            }
            respond(true);
        });
    }, 'The specified email address is already in use.');

// Update current and last login timestamp
FanSchema.methods.setLoginTimestamp = function () {
    this.lastLoginTimestamp = this.currentLoginTimestamp;
    this.currentLoginTimestamp = new Date();
    return Q.ninvoke(this, 'save');
};

// Update state value
FanSchema.path('state', {
    set: function (value) {
        this._oldState = this._doc.state;
        return value;
    }
});

FanSchema.pre('save', function (next) {
    this.currency = 'dollar';

    // isNew is a mongoose property which indicates if the record is new
    if (this.isNew) {
        this.state = 'pending';
    }
    if (process.env.NODE_ENV === 'test') {
        next();
    }
    if (!this.isNew) {
        next();
    }
    if (this.newsletter) {
        unagi.fire('fans:newsletter:subscribe', this);
    }
    next();
});

FanSchema.pre('save', function (next) {
    if (['inactive', 'deleted'].indexOf(this._doc.state) === -1 && ['inactive', 'deleted'].indexOf(this._oldState) !== -1) {
        unagi.fire('fan:state:transition:visible', this.fan_of_artist);
    }
    if (['inactive', 'deleted'].indexOf(this._doc.state) !== -1 && ['inactive', 'deleted'].indexOf(this._oldState) === -1) {
        unagi.fire('fan:state:transition:invisible', this.fan_of_artist);
    }
    next();
});

var updateableFields = {
    profile: ["firstname", "lastname", "email", "password", "password_confirmation", "state",
        "verified", "country", "genres", "age", "picture",
        "arena", "gender", "gr_position", "gr_order", "preferredCountry", "birthdate"
    ]
};

FanSchema.methods.setPasswordAndSave = function validatePassword(password, confirmation) {
    var self = this;

    this.password = password;
    this.password_confirmation = confirmation;

    return Q.ninvoke(self, 'setPassword', password);
};

FanSchema.methods.safeUpdate = function (props, type) {
    var self = this;
    mapFields(this, props, updateableFields[type], FanSchema);

    if (props.password || props.password_confirmation) {
        return this.setPasswordAndSave(props.password, props.password_confirmation)
            .then(function () {
                return Q.ninvoke(self, 'save');
            });
    } else {
        return Q.ninvoke(self, 'save');
    }
};

module.exports = mongoose.model('Fan', FanSchema);
