'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Q = require('q'),
    timestamps = require('mongoose-timestamps'),
    slugify = require('mongoose-slugify'),
    states = require('../public/configs/states.json'),
    youtubeMetaInfo = require('../helper/youtube-info'),
    validateYoutubeUrl = require('../lib/youtube-validate'),
    safeUpdate = require('../lib/model-mapper').mapFields,
    stateHistory = require('./state-history');

// Basic Video schema
var VideoSchema = new Schema({

    ////// MANDATORY FIELDS //////

    title: String,

    // Artist reference to artist's model is mandatory, every album should have an artist
    artist: {type: Schema.Types.ObjectId, ref: 'Artist', index: true},

    // Original source of video
    originalSource: {type: String, enum: ['youtube', 'globalrockstar']},

    // YoutubeUrl (if original source is youtube)
    youtubeURL: String,


    ////// NOT MANDATORY FIELDS //////

    genres: Array,

    copyrightLyrics: String,
    copyrightMusic: String,
    publisher: String,

    // Video stored on amazon
    videoFile: String,
    // Audio stored on amazon
    audioFile: String,

    // Image cover for this video
    image: String,

    // Contest associated to this video
    contest: {type: Schema.Types.ObjectId, ref: 'Contest'},

    // Version 2 is for documents created starting from the 2015
    gr_doc_ver: Number,

    // Current State of the video (see states array)
    state: {index: true, type: String, enum: states},

    // History of states' changes
    stateHistory: [stateHistory]
});

//VideoSchema.methods.loadYoutubeMeta = function (value, cb) {
//    youtubeMetaInfo(this, value, cb);
//};
//
//VideoSchema.path('youtubeURL').validate(function (value) {
//    var self = this;
//    if (this.isModified('youtubeURL')) {
//        var validatedYoutubeUrl = validateYoutubeUrl.ytVidId(value);
//
//        if (!validatedYoutubeUrl) {
//            return false;
//        }
//
//        var update = {
//            "youtube.id": validatedYoutubeUrl
//        };
//
//        Q.ninvoke(mongoose.model('Video').findOneAndUpdate({_id: self._id}, update), 'exec')
//            .then(function (updated) {
//                //console.log(JSON.stringify(updated, null, 2));
//            })
//            .fail(function (err) {
//                console.error(err);
//            });
//
//
//        this.loadYoutubeMeta(value, function (err, obj) {
//            if (err) {
//                console.error(err);
//                return;
//            }
//
//            var update = {
//                "youtubeId": self.youtube.id,
//                "youtube.thumbnails": self.youtube.thumbnails
//            };
//
//            Q.ninvoke(mongoose.model('Video').findOneAndUpdate({_id: self._id}, update), 'exec')
//                .then(function (updated) {
//                    //console.log(JSON.stringify(updated, null, 2));
//                })
//                .fail(function (err) {
//                    console.error(err);
//                });
//        });
//
//    } else {
//        return true;
//    }
//}, 'please speficy a valid youtube url');
//
//VideoSchema.pre('save', function (next) {
//    //console.log("Pre save Video: " + this._id + " yt: " + this.youtubeUrl);
//
//    if (!this.youtubeUrl) {
//        return next();
//    }
//
//    Q.ninvoke(mongoose.model('Video').count({
//        $and: [{
//            _id: {
//                $ne: this._id
//            }
//        }, {
//            youtubeUrl: this.youtubeUrl
//        }]
//    }), 'exec')
//        .then(function (count) {
//            //console.log("Found: " + count + " with same youtube url");
//            if (count > 0) {
//                next(new Error('Youtube Url already in use!'));
//            } else {
//                next();
//            }
//        }
//    )
//        .fail(function (err) {
//            next(err);
//        });
//});
//
VideoSchema.plugin(timestamps, {
    index: true
});

// Fields updateable from admin and from frontend users
var updatableFields = {
    profile: ['title', 'genres', 'youtubeURL'],
    admin: ['title', 'genres', 'youtubeURL', 'contest']
};

// Safely update the model (see updateableFields above)
VideoSchema.methods.safeUpdate = function (props, type) {
    safeUpdate(this, props, updatableFields[type], VideoSchema);
    return Q.ninvoke(this, 'save');
};

module.exports = mongoose.model('Video', VideoSchema);