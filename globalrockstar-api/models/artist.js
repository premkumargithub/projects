'use strict';

/**
 * @module Models:artist
 *
 * @description Model representing artists collection on MongoDB, intended to store and retrieve information about artists
 *
 * @requires module:mongoose
 * @requires module:lodash
 * @requires module:slug
 * @requires module:validator
 * @requires module:node-uuid
 * @requires module:passport-local-mongoose
 * @requires module:mongoose-timestamps
 * @requires module:q
 * @requires module:node-redis-pubsub
 * @requires module:mongoose-slugify
 * @requires module:../config
 * @requires module:../helper/normalize-urls
 * @requires module:../lib/model-mapper
 * @requires module:../public/configs/currencies
 * @requires module:../helper/facebook-info
 * @requires module:./state-history
 * @requires module:./fan
 * @requires module:./plugins/fan-of-artist
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    slug = require('slug'),
    validator = require('validator'),
    uuid = require('node-uuid'),
    passportLocalMongoose = require('passport-local-mongoose'),
    timestamps = require('mongoose-timestamps'),
    Q = require('q'),
    nrp = require('node-redis-pubsub'),
    slugify = require('mongoose-slugify'),
    config = require('../config'),
    normalizeUrls = require('../helper/normalize-urls'),
    mapFields = require('../lib/model-mapper').mapFields,
    currencies = require('../public/configs/currencies'),
    facebookInfo = require('../helper/facebook-info'),
    StateHistory = require('./state-history'),
    Fan = require('./fan'),
    Activity = require('./activities'),
    fanOfArtistPlugin = require('./plugins/fan-of-artist'),
    Schema = mongoose.Schema,
    unagi = new nrp(config.redis);

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

var authTypes = ['facebook'];

// ProjectDonation schema. Refers to Project schema
var ProjectDonation = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    dollar: Number
});

// Artist schema. Refers to project, fans and fans_a schemas.
var ArtistSchema = new Schema({
    // TODO: Comment all these fields!
    name: String,
    email: {
        type: String,
        unique: true,
        index: true,
        validate: validator.isEmail,
        lowercase: true,
        trim: true
    },
    legacy: {
        type: Schema.Types.Mixed
    },
    hashedPassword: String,
    salt: String,
    terms: {
        type: Boolean,
        default: false
    },
    terms14073: {
        type: Boolean,
        default: false
    },
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
    provider: String,
    facebook: String,
    youtube: String,

    // TODO: integrate these artist's links to artist profile
    //spotifyUrl: String,
    //itunesUrl: String,

    twitter: String,
    website: String,
    biography: String,
    city: String,
    country: String,
    message: String,
    genres_music: [String],
    birthdate: Date,
    genres_own: [String],
    picture: String,
    preferredCountry: {
        type: String,
        // FIXME: Check and make it work
        /* jshint -W040 */
        Default: this.country
        /* jshint +W117 */
    },
    contact: {
        first_name: String,
        last_name: String,
        gender: {
            type: String,
            default: 'prefer_not_to_say',
            enum: ['male', 'female', 'prefer_not_to_say']
        },
        address: String,
        postal_code: String,
        country: String,
        telephone: String,
        city: String,
        birthdate: Date,
        email: String
    },
    currency: {
        type: String,
        default: 'dollar'
    },
    // Flag to indicate that ALL paypal data is valid and payments can be made
    paypal_verified: {
        type: Boolean,
        default: false
    },
    paypal_email: String,
    paypal_firstname: String,
    paypal_lastname: String,
    paypal_currency: String,

    featured: {
        type: Boolean,
        default: false
    },
    featured_timestamp: {
        type: Date
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
    state: {
        type: String,
        enum: ['active', 'deleted', 'inactive', 'pending'],
        default: 'pending'
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    projects: [{
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }],
    fans: [{
        type: Schema.Types.ObjectId,
        ref: 'Fan'
    }],
    fans_a: [{
        type: Schema.Types.ObjectId,
        ref: 'Artist'
    }],
    stateHistory: [StateHistory],
    totalPlays: {
        type: Number,
        default: 0
    },
    currentLoginTimestamp: Date,
    lastLoginTimestamp: Date,
    lastLoginIP: String,
    currentLoginIP: String,
    invitationToken: String,
    earnings: {
        projects: [ProjectDonation]
    },
    expenses: {
        projects: [ProjectDonation]
    },
    facebookPages: [String],

    gr_position: String,
    gr_order: Number,
    fanCount: Number,

    // Contest media selected by user
    contestMedia: String,
    // Type of contest media selected by user
    contestMediaType: String,
    // Preferred media selected by user
    preferredMedia: String,
    // Type of preferred media selected by user
    preferredMediaType: String
});

// Add slugify plugin
ArtistSchema.plugin(slugify, {
    position: 'pre',
    lowercase: false,
    softdelete: true,
    index: true,
    prop: 'name',
    slugField: 'slug'
});

// Add timestamps plugin
ArtistSchema.plugin(timestamps, {
    index: true
});

// Add passport-local-mongoose plugin
ArtistSchema.plugin(passportLocalMongoose, options);

// Add normalize urls plugin
ArtistSchema.plugin(normalizeUrls, {
    fields: ['youtube', 'facebook', 'twitter', 'website']
});

// Add fan of artist plugin
ArtistSchema.plugin(fanOfArtistPlugin);

// Add secondary indexes for high performance read operations on these fields
ArtistSchema.index({
    facebookPages: 1,
    state: 1
});

// Mongoose middleware to update doc with currency param before save
ArtistSchema.pre('save', function (next) {
    this.currency = 'dollar';
    next();
});

// Mongoose middleware to update doc with total fanCount before save
ArtistSchema.pre('save', function (next) {
    var self = this;
    Q.all([
        Q.ninvoke(Fan, 'count', {fan_of_artist: this._id, state: {$in: ['active', 'pending']}}),
        Q.ninvoke(mongoose.model('Artist'), 'count', {fan_of_artist: this._id, state: {$in: ['active', 'pending']}})
    ]).spread(function (fans, artists) {
        self.fanCount = fans + artists;
        next();
    }).fail(function (err) {
        console.error(err.stack);
        next();
    });
});

var checkPassword = function (val) {
    //@TODO implement
    if (!val.length) {
        return false;
    }
    return true;
};

// Set virtual attribute not persisted on MongoDB
ArtistSchema.virtual('fullname').get(function () {
    return this.name;
});

// Set virtual attribute not persisted on MongoDB
ArtistSchema.virtual('password')
    .get(function () {
        return this._password;
    })
    .set(function (value) {
        this._password = value;
    });

// Set virtual attribute not persisted on MongoDB
ArtistSchema.virtual('password_confirmation')
    .get(function () {
        return this._password_confirmation;
    })
    .set(function (value) {
        this._password_confirmation = value;
    });

// Validate hashed password
ArtistSchema.path(options.hashField).validate(function (v) {
    if (!this.password) {
        return;
    }
    if (!checkPassword(this.password)) {
        this.invalidate('password', 'required');
    }

    if (this.password !== this.password_confirmation) {
        this.invalidate('password_confirmation', 'not matching');
    }
});

// Set virtual attribute not persisted on MongoDB
ArtistSchema.virtual('userInfo').get(function () {
    return {
        name: this.name,
        slug: this.slug,
        picture: this.picture,
        newsletter: this.newsletter,
        verificationToken: this.verificationToken,
        id: this._id,
        totalPlays: this.totalPlays,
        preferredCountry: this.preferredCountry,
        verified: this.verified,
        email: this.email,
        facebookId: this.facebookId,
        isComplete: this.isComplete,
        state: this.state,
        genres: this.genres_own,
        lastLoginTimestamp: this.lastLoginTimestamp
    };
});

// Save old state and publish an event if artist's state is inactive or deleted
ArtistSchema.path('state', {
    set: function (value) {
        this._oldState = this._doc.state;
        if (['inactive', 'deleted'].indexOf(value) >= 0) {
            unagi.fire('artists:statechange', this, value);
        }
        return value;
    }
});

// Publish an event and update featured_timestamp if an artist has been featured
ArtistSchema.path('featured', {
    set: function (value) {
        if (value) {
            unagi.fire('artists:featured', this);
            this.featured_timestamp = new Date();
        } else {
            this.featured_timestamp = null;
        }
        return value;
    }
});

// Mongoose middleware intended to publish a subscribe event before save
ArtistSchema.pre('save', function (next) {
    if (process.env.NODE_ENV === 'test') {
        return next();
    }
    if (!this.isNew) {
        return next();
    }

    if (this.newsletter) {
        unagi.fire('artists:newsletter:subscribe', this);
    }
    next();
});

// Mongoose middleware intended to store facebook infos before save
ArtistSchema.pre('save', function (next) {
    var self = this;
    if (!this.isNew) {
        return next();
    }
    next();

    if (this.facebook && !this.facebookId) {
        facebookInfo(this.facebook, function (err, fbId) {
            self.facebookId = fbId;
            self.save();
        });
    }
});

// Mongoose middleware intended to publish a transition event about artist's state before save
ArtistSchema.pre('save', function (next) {
    if (['inactive', 'deleted'].indexOf(this._doc.state) === -1 && ['inactive', 'deleted'].indexOf(this._oldState) !== -1) {
        unagi.fire('artist:state:transition:visible', this.fan_of_artist);
    }
    if (['inactive', 'deleted'].indexOf(this._doc.state) !== -1 && ['inactive', 'deleted'].indexOf(this._oldState) === -1) {
        unagi.fire('artist:state:transition:invisible', this.fan_of_artist);
    }
    next();
});

/**
*   @function 
*   @name ArtistSchema.pre-addFan
*   @param {string} fanType User type Fan/Artist who is becoming fan to user
*   @param {string} fanId User id Fan/Artist who is becoming fan to user
*   @callback next 
*   @return forward next task  
**/
var addFanActivity = function (userId, fanType, fanId) {
    var activity = new Activity({
            artist: userId,
            activity: {
                'type': "become_fan",
                'user': fanId,
                'userType': fanType
            }
        });
    activity.save(function (err) {
            if (!err) {
                return true;
            } else {
                return err;
            }
        });
}

// Mongoose validations
ArtistSchema
    .path('email')
    .validate(function (email) {
        if (authTypes.indexOf(this.provider) !== -1) {
            return true;
        }
        return email.length;
    }, 'Email cannot be blank');

ArtistSchema
    .path('email')
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

var updateableFields = {
    profile: ['name', 'email', 'youtube', 'facebook', 'twitter', 'website', 'biography', 'featured', 'verified', 'newsletter',
        'arena', 'state', 'city', 'country', 'genres_music', 'genres_own', 'picture', 'featured_timestamp', 'contact',
        'isComplete', 'fans', 'fans_a', 'birthdate', 'message', 'preferredCountry', 'gr_position', 'gr_order', 'contestMedia',
        'contestMediaType', 'preferredMedia', 'preferredMediaType'
    ]
};

// Set login timestamp
ArtistSchema.methods.setLoginTimestamp = function () {
    this.lastLoginTimestamp = this.currentLoginTimestamp;
    this.currentLoginTimestamp = new Date();
    return Q.ninvoke(this, 'save');
};

// Set password
ArtistSchema.methods.setPasswordAndSave = function validatePassword(password, confirmation) {
    var self = this;

    this.password = password;
    this.password_confirmation = confirmation;

    return Q.ninvoke(self, 'setPassword', password);
};

// Update an artist safely, updating only the updatable fields
ArtistSchema.methods.safeUpdate = function (props, type) {
    var self = this;
    mapFields(this, props, updateableFields[type], ArtistSchema);

    if (props.password || props.password_confirmation) {
        return this.setPasswordAndSave(props.password, props.password_confirmation)
            .then(function () {
                return Q.ninvoke(self, 'save');
            });
    } else {
        return Q.ninvoke(self, 'save');
    }
};

ArtistSchema.methods.canChangeContestMedia = function (media, contest) {
    // TODO: If current contest is active user cannot change contestMedia
    //if (contest.started) {
    //    return false;
    //}

    // We cannot associate a media which is associated to an old contest
    if (media.contest && !media.contest.equals(contest._id)) {
        // console.log("cannot associate " + media.id + " with " + contest.id + ". Media is already associated with: " + media.contest);
        return false;
    }

    return true;
};
/**
*   @function
*   @name ArtistSchema.addFan
*   @desc Execute the query regarding the adding fan in the fan key of artist schema
*   and also update the record of the fan and insert the id of the artist in fan_of_artist key
*   of fan schema
*   @param fanType {string} - Check the user who want to become fan is a artist or fan
*   @param fanId {num} - Unique id of the user
**/
ArtistSchema.methods.addFan = function (fanType, fanId) {
    var dfd = Q.defer();
    // here this is belong to artist of which we want to become fan
    var self = this;
    var model = fanType === 'fan' ? mongoose.model('Fan') : mongoose.model('Artist');
    var pushFan = {};
    pushFan['fans' + (fanType === 'fan' ? '' : '_a')] = fanId;

    var ne = {};
    ne['fans' + (fanType === 'fan' ? '' : '_a')] = {
        $ne: fanId
    };
    // get the record of the user how want to became fan
    Q.ninvoke(model.findOne({
        _id: fanId
    }), 'exec')
        .then(function (fanOrArtist) {
            if (!fanOrArtist) {
                return dfd.reject('No Fan of type: ' + fanType + ' found by id: ' + fanId);
            }
            console.log("Updating fan/artist double linked list.");

            // Adding the And condition which match the id of the artist and
            // then  check if user is already a fan of the artist
            var query = {
                $and: [{
                    _id: self._id
                },
                    ne
                ]
            };
            // In this we use the mongoose $push syntax to store the detail of the fan
            // in the artist record and also increase the count of the fancount in the
            // artist record
            var update = {
                $push: pushFan,
                $inc: {fanCount: 1}
            };
            // Todo check the condition in which one request fail
            // then the sync is lost
            // Make two call one to the Artist colleciton to store the fan and other
            // call the function of plugin fanOfArtistPlugin to store the record of
            // artist in the fan table
            return Q.all([
                Q.ninvoke(mongoose.model('Artist').findOneAndUpdate(query, update), 'exec'),
                fanOrArtist.becameFanOf(self._id)
            ]);
        })
        .spread(function (artist, fan) {
            if (!artist && !fan) {
                console.error('Invalid doubled fan/artist array state! No activity will be created!');
                console.error('  Artist: ' + self._id + ' FanId: ' + fanId + ' FanType: ' + fanType);
                dfd.resolve(null);
            } else {
                var eventName = 'artists:newfan:' + (fanType === 'fan' ? 'fan' : 'artist');
                console.log('Notify: ' + eventName);

                //Add the activity to be a fan 
                addFanActivity(self._id, fanType, fanId);
                // Fire the event of artists:newfan:artist to the redis server
                // this functionality in the handle by the worker of redis server
                // that was define in the grs-activity fork
                unagi.fire(eventName, [artist, fan]);
                delete artist.hashedPassword;
                delete artist.salt;
                if (artist.hashedPassword) {
                    artist.hashedPassword = "";
                }
                if (artist.salt) {
                    artist.salt = "";
                }
                dfd.resolve(artist);
            }

        })
        .fail(function (err) {
            console.error('Artist.addFan failed!');
            console.error('  Artist: ' + self._id + ' FanId: ' + fanId + ' FanType: ' + fanType);
            console.error(err);
            dfd.reject(err);
        });
    return dfd.promise;
};

// Update artist's paypal account
ArtistSchema.statics.updatePayPalAccount = function (artistId, paypal_email, paypal_firstname, paypal_lastname, paypal_currency, paypal_verified) {
    var dfd = Q.defer();

    if (!artistId) {
        return dfd.reject(new Error('No artistId given'));
    }
    if (!paypal_email || !paypal_firstname || !paypal_lastname) {
        // Make really sure that no one is accidentialy saving a false paypal_verified:true when
        // essential data missing
        paypal_verified = false;
        paypal_currency = '';
    }

    console.log('Updating PayPal account => ');
    console.log('- artistId: ' + artistId);
    console.log('- paypal_email: ' + paypal_email);
    console.log('- paypal_firstname: ' + paypal_firstname);
    console.log('- paypal_lastname: ' + paypal_lastname);
    console.log('- paypal_currency: ' + paypal_currency);
    console.log('- paypal_verified: ' + paypal_verified);

    Q.ninvoke(mongoose.model('Artist').findOneAndUpdate({
        _id: artistId
    }, {
        paypal_email: paypal_email,
        paypal_firstname: paypal_firstname,
        paypal_lastname: paypal_lastname,
        paypal_currency: paypal_currency,
        paypal_verified: paypal_verified
    }), 'exec')
        .then(function (updated) {
            if (!updated) {
                return dfd.reject(new Error('Updating PayPal account failed for artist: ' + artistId));
            }
            dfd.resolve(updated);
        })
        .fail(function (err) {
            console.error(err);
            dfd.reject(err);
        });
    return dfd.promise;
};

module.exports = mongoose.model('Artist', ArtistSchema);
