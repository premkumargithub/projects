'use strict';
/**
 *@module Controller:Videos
 *@description This modulle is used for providing the services to videos activities
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:Video
 *@requires module:hapi
 *@requires module:../lib/mongoose-hapi-errors
 *@requires module:../lib/model-mapper
 *@requires module:../config
 *@requires module:../lib/event-emitter.js
 *@requires module:q
 *@requires module:node-redis-pubsub
 **/
var mongoose = require('mongoose');
var Video = mongoose.model('SupportVideo');
var Hapi = require('hapi');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var ObjectId = mongoose.Types.ObjectId;
var mapper = require('../lib/model-mapper');
var config = require('../config');
var emitter = require('../lib/event-emitter.js');
var Q = require('q');
var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);

/**
 *   @name Controller:Videos.findVideo
 *   @function
 *   @description This function gives a single record from Video model according to the param pass to it
 *   @param {object} query - find one record
 *   @param {num} Video - param used to find record
 **/
var findVideo = Q.nbind(Video.findOne, Video);

module.exports = {
    /**
     *   @name Controller:Videos.index
     *   @function
     *   @param {object} req - Request object
     *   @param {interface} reply - hapi reply interface
     *   @description It checks video Id from the session
     *   then populate a query and fetchs the date from Video model
     **/
    index: function (req, reply) {
        var sortBy = req.query.sort || "createdAt",
            query;

        if (req.params.id) {
            query = {
                _id: req.params.id,
                artist: req.pre.artist._id
            };

            Video.find(query, function (err, videos) {
                if (err) {
                    return reply(reformatErrors(err));
                }
                if (!videos) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(videos);
                }
            });
        } else {

            query = req.pre.search || {};

            if (req.pre.artist) {
                query.$and = query.$and || [];
                query.$and.push({artist: req.pre.artist._id});
            }

            Video.find(query).populate('artist').sort(sortBy).exec(function (err, videos) {
                reply(videos);
            });
        }
    },
    /**
     * @name Controller:Videos.count
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It checks video Id from the session
     * then populate a query and fetchs the date from Video model
     **/
    count: function (req, reply) {
        if (req.params.id) {
            Video.count({artist: req.pre.artist._id}, function (err, ret) {
                reply({count: ret});
            });
        } else {
            var agg = [{
                $group: {
                    _id: "$artist",
                    total: {$sum: 1}
                }
            }];

            var sortBy = req.query.sort || "createdAt";

            Video.aggregate(agg).sort(sortBy).exec(function (err, logs) {
                reply(logs);
            });
        }
    },
    /**
     * @name Controller:Videos.show
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event is used for retrieving the record from Video model
     * @returns {Object} video object
     **/
    show: function (req, reply) {
        var query = {
            $or: [{slug: req.params.id}]
        };

        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }

        Video.findOne(query).populate('artist').exec(function (err, videos) {
            if (err) {
                return reply(reformatErrors(err));
            }
            if (!videos) {
                reply(Hapi.error.notFound());
            } else {
                emitter.emit('video:play', videos);
                reply(videos);
            }
        });
    },
    /**
     * @name Controller:Videos.create
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event is used for ceating the video record through Video model
     * @returns {Object} video object
     **/
    create: function (req, reply) {
        var video = new Video(req.payload);
        video.state = 'pending';
        video.artist = req.pre.artist._id;
        video.save(function (err, obj) {
            console.log('video:create:save-complete:%s', video._id);
            if (!err) {
                reply(obj);
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
     * @name Controller:Videos.update
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event is used for updating the video record into Video model
     * @returns {Object} video object
     **/
    update: function (req, reply) {
        Video.findOne({_id: req.params.id}).populate('artist').exec(function (err, video) {
            if (err) {
                return reply(reformatErrors(err));
            }

            if (!video) {
                reply(Hapi.error.notFound());
                return;
            }

            if (req.payload.youtubeUrl && video.youtubeUrl != req.payload.youtubeUrl && !req.headers['globalrockstar-backend']) {
                req.payload.state = 'pending';
            }

            video.safeUpdate(req.payload, 'admin')
                .then(function (data) {
                    console.log('video:safe-update:%s', video._id);
                    return reply(data[0]);
                })
                .fail(function (err) {
                    console.log('video:safe-update-fail:%s', video._id);
                    console.error(err);
                    return reply(reformatErrors(err));
                });
        });

    },
    /**
     * @name Controller:Videos.stateChange
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event is used for populating the video state history and saved to Video model
     * @returns {Object} object
     **/
    stateChange: function (req, reply) {
        Video.findOne({_id: req.params.id}).populate('artist').exec(function (err, video) {
            if (err) {
                reply(Hapi.error.notFound());
            }

            var oldState = video.get('state');
            if (oldState === req.payload.state) {
                return reply(video);
            }

            video.state = req.payload.state;
            var stateHistory = {
                from: oldState,
                to: req.payload.state,
                category: req.payload.category,
                comment: req.payload.comment,
                createdAt: new Date()
            };

            video.stateHistory.push(stateHistory);
            video.save(function (err, video) {
                console.log('video:state-change:save-complete:%s', video._id);
                if (!err) {
                    unagi.fire('artists:videos:statechange', {state: stateHistory, data: video});
                    reply(video);
                } else {
                    return reply(reformatErrors(err));
                }
            });
        });
    },
    /**
     * @name Controller:Videos.delete
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event is used for deleting the video from Video model
     * @returns {Object} video object
     **/
    delete: function (req, reply) {
        Video.findOne({_id: req.params.id}, function (err, video) {
            if (err) {
                reply(Hapi.error.notFound());
            }

            video.remove(function (err, video) {
                if (err) {
                    reply(Hapi.error.internal('internal', err));
                }
                reply('');
            });

        });
    }
};
