'use strict';
/**
*   @module Controller:Comments
*   @description this module is used for comments and reply on the artist's profile
*   Required modules are defined here
*   @requires module:mongoose
*   @requires module:Hepi
*   @requires module:../lib/mongoose-hapi-errors
*   @requires module:Comment
*   @requires module:Artist
*   @requires module:Fan
*   @requires module:Activity
*   @requires module:q
*/
var continent = require('../config/country-list/countries'),
    mongoose = require('mongoose'),
    Hapi = require('hapi'),
    reformatErrors = require('../lib/mongoose-hapi-errors'),
    Comment = mongoose.model('Comment'),
    Artist = mongoose.model('Artist'),
    Fan = mongoose.model('Fan'),
    Activity = mongoose.model('Activity'),
    Q = require('q');

/**
*   @function Controller:Comments.setQuery
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
*   @function Controller:Comments.populateComment
*   @param {object} comment Comment object
*   @param {object} targetModel Model name either Artist or Fan
*   @description This is populating the comments user object
*   @callback callback function 
*   @returns {Object} comment object
*/
function populateComment(comment, targetModel, callback) {  
    comment.populate('artist', '_id slug name picture')
    .populate('user', '_id slug name picture', targetModel, function (err, comments) {
        if (!err) {
            comments = comments.toObject();
            populateReply(comments.replies, function (result) {
                comments.replies =  result;   
                callback(comments);
            });
        } else {
            return callback(reformatErrors(err));
        }
    });
}

/**
*   @function Controller:Comments.populateReply
*   @param {object} replyObj reply object
*   @description This is used to pupulate the reply object user
*   @callback callback function 
*   @returns {Object} reply object
*/
function populateReply(replyObj,  callback) {
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
                        if (i == total - 1) {
                            callback(replyObj);
                        } 
                    }   
                }
            );
        } else {
            Fan.findOne({_id: s.user}, '_id slug name picture', 
                function (err, userData) {
                    if (!err) {
                        s.user = userData;
                        if (i == total - 1) {
                            callback(replyObj);
                        } 
                    }   
                }
            );
        }        
    });
}

module.exports = {
    /**
    *   Get the total counts for comments and activity
    *   @param {object} req - Request with the artist slug
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    getTotalStream: function (req, reply) {
        Artist.findOne({slug: req.params.userId}, '_id',
            function (err, id) {
            if (!err) {
                if (!id) {
                    reply({
                        comments: Math.ceil(0),
                        activities: Math.ceil(0)
                    });
                } else {
                    var query1 = {artist: id._id};
                    var query2 = {$or: [
                                    { artist: id._id }, 
                                    { 'activity.user': (id._id).toString() }]
                                };
                    Q.all([
                        Comment.count(query1).exec(),
                        Activity.count(query2).exec()
                        ])
                .then(function (counts) {
                    reply({
                        comments: Math.ceil(counts[0]),
                        activities: Math.ceil(counts[1])
                    });
                });
                }
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
    *   Get the comments on the artist's profile page
    *   @param {object} req - Request with the artist ID
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    index: function (req, reply) {
        var query = setQuery(req),
            start, offset;
        if (req.params.artistId) {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({
                artist: req.params.artistId
            });  
        }
        if (req.query.continent) {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({
                continent: req.query.continent
            });  
        }
        if (req.query.country) {
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({
                country: req.query.country
            });  
        }

        var sortBy = req.query.sort || '-createdAt';
        if (req.query.start && req.query.end) { 
            start = req.query.start;
            offset = req.query.end;
        }

        if (start !== null && offset !== null) {
            Q.all([
                Comment.count(query).exec(),
                Comment.find(query).sort(sortBy)
                        .skip(start)
                        .limit(offset)
                        .exec()
                ])
            .then(function (comments) {
                var commentResult = comments[1];
                var total = Math.ceil(comments[0]);
                var currentTotal = commentResult.length;
                if (!total) {
                    reply({
                        total: total,
                        results: commentResult
                    });
                }
                var data = [];
                commentResult.forEach(function (s, i) {
                    if (s.userType == 'artist') {
                        populateComment(s, 'Artist', function (comment) {
                            data.push(comment); 
                            if (i == currentTotal - 1) {
                                reply({
                                        total: total,
                                        results: data
                                    });
                            }    
                        });
                    } else {
                        populateComment(s, 'Fan', function (comment) {
                            data.push(comment); 
                            if (i == currentTotal - 1) {
                                reply({
                                    total: total,
                                    results: data
                                });
                            }  
                        });
                    }
                });
            });
        } else {
            Comment.find(query).sort(sortBy).populate('artist', '_id slug name picture')
            .populate('user', '_id slug name picture').exec()
            .then(function (comments) {
                reply(comments);
            });
        }
    },
    /**
    *   Creates the comment on the artist's profile page
    *   @param {object} req - Request with the comments data object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    create: function (req, reply) {
        var comment = new Comment({
                artist: req.payload.artistId,
                user: req.payload.userId,
                userType: req.payload.userType,
                country: req.payload.country,
                continent: continent.CC[req.payload.country], //Set continent
                message: req.payload.message
            });

        comment.save(function (err, savedComment) {
            if (!err) {
                if (savedComment.userType == 'artist') {
                    populateComment(savedComment, 'Artist', function (comments) {
                        reply(comments);   
                    });
                } else {
                    populateComment(savedComment, 'Fan', function (comments) {
                        reply(comments);   
                    });
                }
            } else {
                return reply(reformatErrors(err)); 
            }
        });
    },
    /**
    *   Like a comment on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    like: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }
                if (comment.likes.indexOf(req.payload.userId) === -1) {
                    comment.likes.push(req.payload.userId);  
                }
                comment.save(function (err) {
                    if (!err) {
                        reply({message: "You liked successfully"});
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
    *   Unlike a comment on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    unLike: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }
                if (comment.likes.indexOf(req.params.userId) >= 0) {
                    comment.likes.splice(comment.likes.indexOf(req.params.userId), 1);  
                }
                comment.save(function (err) {
                    if (!err) {
                        reply({message: "You unliked successfully"});
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
    *   Like a reply on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    likeReply: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }
                comment.replies.forEach(function (data) {
                    if (data._id.equals(req.params.replyId)) {
                        if (data.likes.indexOf(req.payload.userId) === -1) {
                            data.likes.push(req.payload.userId);  
                        }
                    }
                });
                comment.save(function (err) {
                    if (!err) {
                        reply({message: "You liked successfully"});
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
    *   Unlike a reply on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    unLikeReply: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }
                comment.replies.forEach(function (data) {
                    if (data._id.equals(req.params.replyId)) {
                        if (data.likes.indexOf(req.params.userId) >= 0) {
                            data.likes.splice(data.likes.indexOf(req.params.userId), 1);  
                        }
                    }
                });
                comment.save(function (err) {
                    if (!err) {
                        reply({message: "You unliked successfully"});
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
    *   Reply on a comment on the artist's profile page
    *   @param {object} req - Request with the reply data object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    replyOnComment: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }

                var obj = {};
                obj.user = req.payload.userId;
                obj.userType = req.payload.userType;
                obj.message = req.payload.message;
                obj.createdAt = Date();
                comment.replies.push(obj);
                comment.save(function (err, comment) {
                    if (!err) {
                        var commentObj = {};
                        var latestComment = comment.replies[comment.replies.length - 1];
                        commentObj.userType = obj.userType;
                        commentObj.message = obj.message;
                        commentObj._id = latestComment._id;
                        commentObj.createdAt = latestComment.createdAt;
                        commentObj.flagged = [];
                        commentObj.likes = [];
                        if (obj.userType == 'artist') {
                            Artist.findOne({_id: obj.user}, '_id slug name picture', 
                                function (err, userData) {
                                    if (!err) {
                                        commentObj.user = userData;
                                        reply(commentObj);
                                    } else {
                                        return reply(reformatErrors(err));   
                                    }    
                                });
                        } else {
                            Fan.findOne({_id: obj.user}, '_id slug name picture', 
                                function (err, userData) {
                                    if (!err) {
                                        commentObj.user = userData;
                                        reply(commentObj);
                                    } else {
                                        return reply(reformatErrors(err));   
                                    }  
                                });
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
    *   Delete a comment on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    deleteComment: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }
                comment.remove(function (err) {
                    if (!err) {
                        reply({message: "Comment deleted successfully"});
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
    *   Delete a reply from on the artist's profile
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error object with code
    */
    deleteReply: function (req, reply) {
        Comment.findByIdAndUpdate({_id: req.params.commentId},
            {
                //Removing the a reply from the comment
                $pull: { 
                    replies: { _id: req.params.replyId }
                }
            }, function (err) {
                if (!err) {
                    reply({message: "You deleted successfully"});
                } else {
                    return reply(reformatErrors(err));
                }
            });
    },
    /**
    *   Flag on a comment on the artist's profile page
    *   @param {object} req - Request object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    flagComment: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }
                var obj = {};
                obj.createdAt = new Date();
                obj.user = req.payload.userId;
                obj.type = req.payload.type;
                comment.flagged.push(obj);
                comment.save(function (err) {
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
    *   Flag to Reply on a comment on the artist's profile page
    *   @param {object} req - Request with the reply data object
    *   @param {function} reply - Hapi interface, Which replies 
    *   the success/Error objects with codes 
    */
    flagToReplyOnComment: function (req, reply) {
        Comment.findOne({
            _id: req.params.commentId
        }, function (err, comment) {
            if (!err) {
                if (!comment) {
                    return reply(Hapi.error.notFound());
                }
                comment.replies.forEach(function (data) {
                    if (data._id.equals(req.params.replyId)) {
                        var obj = {};
                        obj.user = req.payload.userId;
                        obj.type = req.payload.type;
                        data.flagged.push(obj);
                    }
                });
                comment.save(function (err) {
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
