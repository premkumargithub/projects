'use strict';
/**
*   @module Controller:Activities
*   @description this module is used for activities and reply on the artist's profile
*   Required modules are defined here
*   @requires module:../config/country-list/countries
*   @requires module:mongoose
*   @requires module:hapi
*   @requires module:../lib/mongoose-hapi-errors
*   @requires module:Activity
*   @requires module:Artist
*   @requires module:Fan
*   @requires module:q
*/
var continent = require('../config/country-list/countries'),
    mongoose = require('mongoose'),
    Hapi = require('hapi'),
    reformatErrors = require('../lib/mongoose-hapi-errors'),
    Activity = mongoose.model('Activity'),
    Artist = mongoose.model('Artist'),
    Contest = mongoose.model('Contest'),
    Fan = mongoose.model('Fan'),
    Q = require('q');

/**
*   @function Controller:Activities.setQuery
*   @param {object} req Request type of object
*   @description This is preparing the query to get comments 
*   @returns {String} Query string
*/
function setQuery(req) {
    var query = req.pre.search || {};

    if (req.query.country) {
        if (!query.$and) {
            query.$and = [];
        }
        query.$and.push({
            country: req.query.country
        });
    }

    return query;
}

/**
*   @function Controller:Activities.populateUser
*   @param {object} activityObj Recently created activity object 
*   @description This is for populating the user 
*   @callback return object
*   @returns {Object} activity object after populating the user
*/
function populateUser(activityObj, callback) {
    activityObj = activityObj.toObject();
    if (activityObj.activity.userType == 'artist') {
        Artist.findOne({_id: activityObj.activity.user}, '_id slug name picture', 
            function (err, userData) {
                if (!err) {
                    activityObj.activity.user = userData;
                    callback(activityObj);
                } else {
                    callback(activityObj);   
                }    
            });
    } else {
        Fan.findOne({_id: activityObj.activity.user}, '_id slug name picture', 
            function (err, userData) {
                if (!err) {
                    activityObj.activity.user = userData;
                    callback(activityObj);
                } else {
                    callback(activityObj);   
                }    
            });
    }

}
/**
*   @function Controller:Activities.populateReplyUser
*   @param {object} replyObj reply object 
*   @description This is for populating reply user 
*   @callback return object
*   @returns {Object} replies object after populating the user
*/
function populateReplyUser(replyObj, callback) {
    var replyData = [];
    if (!replyObj.length) {
        callback(replyData);
    }
    var total = replyObj.length;
    replyObj.forEach(function (s, i) {
        if (s.userType == 'artist') {
            Artist.findOne({_id: s.user}, '_id slug name picture', 
                function (err, userData) {
                    if (!err) {
                        s.user = userData;
                        replyData.push(s);
                        if (i == total - 1) {
                            callback(replyData);
                        } 
                    }   
                }
            );
        } else {
            Fan.findOne({_id: s.user}, '_id slug name picture', 
                function (err, userData) {
                    if (!err) {
                        s.user = userData;
                        replyData.push(s);
                        if (i == total - 1) {
                            callback(replyData);
                        } 
                    }   
                }
            );
        }        
    });
}

/**
*   @function Controller:Activities.populateTypeUser
*   @param {object} s activity object 
*   @description This is for actitiy details  
*   @callback return object
*   @returns {Object} replies object after populating the activity
*/
function populateTypeUser(s, callback) {
    if (s.activity.type == 'become_fan') {
        if (s.activity.userType == 'artist') {
            Artist.findOne({_id: s.activity.user}, '_id slug name picture', 
            function (err, userData) {
                if (!err) {
                    s.activity.user = userData;
                    callback(s.activity);
                }   
            }
        );
        } else {
            Fan.findOne({_id: s.activity.user}, '_id slug name picture', 
            function (err, userData) {
                if (!err) {
                    s.activity.user = userData;
                    callback(s.activity);
                }   
            }
        );
        }   
    } else if (s.activity.type == 'participation') {
        Contest.findOne({_id: s.activity.contest}, '_id slug name', 
        function (err, userData) {
            if (!err) {
                s.activity.contest = userData;
                callback(s.activity);
            }   
        });
    } else {
        callback(s.activity); 
    }
}

module.exports = {
    /**
    *   Get the Activities on the artist's profile page
    *   @param {object} req - Request with the artist ID
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    index: function (req, reply) {
        var query = setQuery(req),
            start, offset;
        if (req.params.artistId) {
            if (!query.$or) {
                query.$or = [];
            }
            query.$or.push(
                { artist: req.params.artistId },
                { 'activity.user': req.params.artistId }
            );  
        }
        if (req.query.continent) {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({
                continent: req.query.continent
            });  
        }

        var sortBy = req.query.sort || '-createdAt';
        if (req.query.start && req.query.end) { 
            start = req.query.start;
            offset = req.query.end;
        }
        if (start !== null && offset !== null) {
            Q.all([
                Activity.count(query).exec(),
                Activity.find(query).sort(sortBy)
                        .skip(start)
                        .limit(offset)
                        .populate('artist', '_id slug name picture').exec()
                ])
            .then(function (activities) {
                var total = Math.ceil(activities[0]);
                activities = activities[1];
                var currentTotal = activities.length;
                var data = [];
                if (!currentTotal) {
                    reply({
                        total: total,
                        results: data
                    });
                }
                activities.forEach(function (s, i) {
                    s = s.toObject();
                    populateTypeUser(s, function (activityUser) {
                        s.activity = activityUser;
                        populateReplyUser(s.replies, function (result) {
                            s.replies = result;
                            data.push(s);
                            if (i == currentTotal - 1) {
                                reply({
                                    total: total,
                                    results: data
                                });
                            } 
                        });
                    });
                });
            });
        } else {
            Activity.find(query).sort(sortBy).populate('artist', '_id slug name picture').exec()
            .then(function (activities) {
                reply(activities);
            });
        }
    },
    /**
    *   Creates the activity on the artist's profile page
    *   @param {object} req - Request with the activity data object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    create: function (req, reply) {
        var activity = new Activity({
            artist: req.payload.artistId,
            activity: req.payload.activity,
            country: req.payload.country,
            continent: continent.CC[req.payload.country] //Set continent
        });
        activity.save(function (err, savedActivity) {
            if (!err) {
                savedActivity.populate('artist', '_id slug name picture', 
                    function (err, populatedActivity) {
                        if (populatedActivity.activity.type == 'become_fan') {
                            populateUser(populatedActivity, function (result) {
                                reply(result);
                            });
                        } else {
                            reply(populatedActivity);
                        }
                    });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
    *   Delete the activity on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    deleteActivity: function (req, reply) {
        Activity.findOne({
            _id: req.params.activityId
        }, function (err, activity) {
            if (!err) {
                if (!activity) {
                    return reply(Hapi.error.notFound());
                }
                activity.remove(function (err) {
                    if (!err) {
                        reply({message: "Activity deleted successfully"});
                    } else {
                        return reply(reformatErrors(err)); 
                    }
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
    *   Reply on a activity on the artist's profile page
    *   @param {object} req - Request with reply object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    replyOnActivity: function (req, reply) {
        Activity.findOne({
            _id: req.params.activityId
        }, function (err, activity) {
            if (!err) {
                if (!activity) {
                    return reply(Hapi.error.notFound());
                }

                var obj = {};
                obj.user = req.payload.userId;
                obj.userType = req.payload.userType;
                obj.message = req.payload.message;
                obj.createdAt = Date();
                activity.replies.push(obj);
                activity.save(function (err, activity) {
                    if (!err) {
                        var activityData = activity.replies[activity.replies.length - 1];
                        var replyObj = {};
                        replyObj.userType = obj.userType;
                        replyObj.message = obj.message;
                        replyObj._id = activityData._id;
                        replyObj.createdAt = activityData.createdAt;
                        replyObj.flagged = [];
                        if (obj.userType == 'artist') {
                            Artist.findOne({_id: obj.user}, '_id slug name picture',
                                function (err, userObj) {
                                    if (!err) {
                                        replyObj.user = userObj;
                                        reply(replyObj);
                                    }
                                }
                            );
                        } else {
                            Fan.findOne({_id: obj.user}, '_id slug name picture',
                                function (err, userObj) {
                                    if (!err) {
                                        replyObj.user = userObj;
                                        reply(replyObj);
                                    }
                                }
                            );
                        }
                    } else {
                        return reply(reformatErrors(err)); 
                    }
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
    *   Delete a reply from on the artist's profile acitivity
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error object with code
    */
    deleteReply: function (req, reply) {
        Activity.findByIdAndUpdate({_id: req.params.activityId},
            {
                //Removing the a reply from the activity
                $pull: { 
                    replies: { _id: req.params.replyId }
                }
            }, function (err) {
                if (!err) {
                    reply({message: "Reply deleted successfully"});
                } else {
                    return reply(reformatErrors(err));
                }
            });
    },
    /**
    *   Flag on a activity on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    flagActivity: function (req, reply) {
        Activity.findOne({
            _id: req.params.activityId
        }, function (err, activity) {
            if (!err) {
                if (!activity) {
                    return reply(Hapi.error.notFound());
                }
                var obj = {};
                obj.createdAt = new Date();
                obj.user = req.payload.userId;
                obj.type = req.payload.type;
                activity.flagged.push(obj);
                activity.save(function (err) {
                    if (!err) {
                        reply({message: "You flagged successfully"});
                    } else {
                        return reply(reformatErrors(err)); 
                    }
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
    *   Flag to Reply on a activity on the artist's profile page
    *   @param {object} req - Request with the reply data object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    flagToReplyOnActivity: function (req, reply) {
        Activity.findOne({
            _id: req.params.activityId
        }, function (err, activity) {
            if (!err) {
                if (!activity) {
                    return reply(Hapi.error.notFound());
                }
                activity.replies.forEach(function (data) {
                    if (data._id.equals(req.params.replyId)) {
                        var obj = {};
                        obj.user = req.payload.userId;
                        obj.type = req.payload.type;
                        data.flagged.push(obj);
                    }
                });
                activity.save(function (err) {
                    if (!err) {
                        reply({message: "You flagged successfully"});
                    } else {
                        return reply(reformatErrors(err)); 
                    }
                });
            } else {
                return reply(reformatErrors(err));
            }
        });
    }

};
