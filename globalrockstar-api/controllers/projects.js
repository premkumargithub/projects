'use strict';
/**
*   @module Controller:Projects
*   @description decision maker controller for Projects method
*   Required module define here for this controller
*   @requires module:mongoose
*   @requires module:Project
*   @requires module:hapi
*   @requires module:q
*   @requires module:lodash
*   @requires module:node-redis-pubsub
*   @requires module:../config
*   @requires module:../lib/mongoose-hapi-errors
*   @requires module:../lib/paginator
*   @requires module:../lib/sorter
**/
var mongoose = require('mongoose'),
    Project = mongoose.model('Project'),
    Hapi = require('hapi'),
    Q = require('q'),
    _ = require('lodash'),
    nrp = require('node-redis-pubsub'),
    config = require('../config'),
    unagi = new nrp(config.redis),
    reformatErrors = require('../lib/mongoose-hapi-errors'),
    paginator = require('../lib/paginator'),
    sorter = require('../lib/sorter');

/**
*   @name Controller:Projects.prepareUpdate
*   @function
*   @param {object} req Request object
*   @param {interface} reply  hapi reply interface
*   @param {object} project Service type of object
*   @description: It checks empty(project)
*   @return {Boolean} false If project is empty OR populate the social URLs in the project object
*/
function prepareUpdate(req, project, reply) {
    if (!project) {
        reply(Hapi.error.notFound());
        return;
    }

    project.attrAccessible.forEach(function (attr) {
        if (req.payload[attr] !== undefined && attr !== 'defaultReward') {
            project[attr] = req.payload[attr];
        }
    });

    if (!req.payload.youtubeUrl) {
        project.youtubeUrl = null;
    }
    if (!req.payload.teaserImage) {
        project.teaserImage = null;
    }
    if (req.payload.youtubeUrl) {
        project.teaserImage = null;
    }
    if (req.payload.teaserImage) {
        project.youtubeUrl = null;
    }

    if (!req.payload.defaultReward || req.payload.defaultReward === '' || req.payload.defaultReward === '000000000000000000000000') {
        project.defaultReward = undefined;
    }
}

/**
*   wrapper function which encapsulate project module actions
*/
module.exports = {
    /**
    *   @name Controller:Projects.index
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description It checks showdeleted from session
    *   then prepare the query with pagination, fetch the data from the model
    **/
    index: function (req, reply) {
        var query = req.pre.search || {};

        if (!req.query.showdeleted || req.query.showdeleted !== '1') {
            query = {
                $and: [{
                    deleted: null
                },
                    _.cloneDeep(query)
                ]
            };
        }

        var mQuery = Project.find(query);
        sorter(req, mQuery);
        paginator(req, mQuery);
        mQuery.populate('artist', 'name slug');
        Q.all([
            Q.ninvoke(Project.count(query), 'exec'),
            Q.ninvoke(mQuery, 'exec')
        ]).spread(function (count, projects) {
            reply({
                items: projects,
                itemCount: count,
                pages: Math.ceil((count / req.pre.paginator.pagesize))
            });
        });
    },
    /**
    *   @name Controller:Projects.byId
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description It checks fetch the project from the model
    **/
    byId: function (req, reply) {
        console.log("ASFHSAOPJFBASPUIBGASIUGBASIUPG");
        var query = {
            _id: req.params.id
        };

        var mQuery = Project.findOne(query).populate('artist', '-hashedPassword -salt')
                            .populate('defaultReward');

        Q.ninvoke(mQuery, 'exec')
            .then(function (project) {
                if (!project) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(project);
                }

            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },
    /**
    *   @name Controller:Projects.byArtistId
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for project data from project model based on the artists Id
    *   returns {object} project data
    **/
    byArtistId: function (req, reply) {
        var query = {
            $and: [{
                artist: req.params.artistId
            }, {
                deleted: null
            }]
        };

        var mQuery = Project.find(query);
        if (req.params.projectId && req.params.projectId.match(/^[0-9a-fA-F]{24}$/)) {
            query.$and.push({
                _id: req.params.projectId
            });
            mQuery = Project.findOne(query);
        }
        Q.ninvoke(mQuery, 'exec')
            .then(function (result) {
                if (!result) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(result);
                }
            })
            .fail(function (err) {
                return reply(reformatErrors(err));
            });
    },
    /**
    *   @name Controller:Projects.create
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for create project in project model
    *   returns {object} project data
    **/
    create: function (req, reply) {
        var project = new Project(req.payload);

        prepareUpdate(req, project, reply);

        project.artist = req.pre.artist._id;
        project.currency = 'USD'; //req.pre.artist.currency;
        project._country = req.pre.artist.country;
        Q.ninvoke(project, 'save')
            .then(function () {
                return Q.ninvoke(Project.findOne({
                    _id: project.id
                }), 'exec');
            }).then(function (project) {
                return reply(project);
            })
            .fail(function (err) {
                console.dir(err);
                return reply(reformatErrors(err));
            });
    },
    /**
    *   @name Controller:Projects.update
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for updating the project in project model
    *   returns {object} project data
    **/
    update: function (req, reply) {
        var shouldNotify = false;
        Q.ninvoke(Project.findOne({
            _id: req.params.id
        }), 'exec')
            .then(function (project) {
                if (!project) {
                    reply(Hapi.error.notFound());
                    return;
                }
                if (project.state === 'published') {
                    shouldNotify = true;
                }

                prepareUpdate(req, project, reply);

                if (project.state === 'published') {
                    project.state = 'publish-pending';
                }

                return Q.ninvoke(project, 'save');
            }).then(function () {
                return Q.ninvoke(Project.findOne({
                    _id: req.params.id
                }), 'exec');
            }).then(function (project) {
                if (shouldNotify) {
                    unagi.fire('project:modified', {
                        project: project
                    });
                }
                return reply(project);
            }).fail(function (err) {
                console.dir(err);
                return reply(reformatErrors(err));
            });
    },
    /**
    *   @name Controller:Projects.activate
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for activating the project based on 
    *   the artists Id and published action in project model
    **/
    activate: function (req, reply) {
        var query = {
            $and: [{
                artist: req.pre.artist._id
            }, {
                deleted: null
            }, {
                $or: [{
                    state: 'publish-pending'
                }, {
                    state: 'published'
                }]
            }, {
                $or: [{
                    releaseDate: {
                        $exists: false
                    }
                }, {
                    releaseDate: null
                }, {
                    releaseDate: {
                        $gt: new Date()
                    }
                }]
            }]
        };
        Q.ninvoke(Project.find(query), 'exec')
            .then(function (res) {
                if (res.length) {
                    var message = 'only one active project allowed per artist at a given moment';
                    return reply(Hapi.error.badRequest(message));
                }
                return Q.ninvoke(Project.findByIdAndUpdate(req.params.projectId, {
                    state: 'publish-pending'
                }), 'exec');
            })
            .then(function (updated) {
                //console.log('Emitting: project:activated');
                unagi.fire('project:activated', {
                    project: updated
                });
                reply(updated);
            });

    },
    /**
    *   @name Controller:Projects.deactivate
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for de-activating the project based 
    *   on the project Id and publish-pending state in project model
    *   returns {object} data
    **/
    deactivate: function (req, reply) {
        var query = {
            $and: [{
                _id: req.params.projectId
            }, {
                state: 'publish-pending'
            }]
        };
        Q.ninvoke(Project.findOneAndUpdate(query, {
            state: 'created'
        }), 'exec')
            .then(function (updated) {
                if (!updated) {
                    var message = 'Project in an invalid state for deactivation';
                    return reply(Hapi.error.badRequest(message));
                }
                reply(updated);
            });
    },
    /**
    *   @name Controller:Projects.publish
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for updating the project based on the 
    *   published state in project model
    *   returns {object} data
    **/
    publish: function (req, reply) {
        var query = {
            $and: [{
                _id: req.params.projectId
            }, {
                state: 'publish-pending'
            }]
        };
        Q.ninvoke(Project.findOneAndUpdate(query, {
            state: 'published'
        }), 'exec')
            .then(function (updated) {
                if (!updated) {
                    var message = 'Project in an invalid state for publication';
                    return reply(Hapi.error.badRequest(message));
                }
                //console.log('Emitting: project:published');
                return Q.ninvoke(Project.findOne({
                    _id: updated._id
                }).populate('artist', 'email name contact'), 'exec');
            }).then(function (populated) {
                unagi.fire('project:published', {
                    project: populated
                });
                reply(populated);
            });
    },
    /**
    *   @name Controller:Projects.denyPublish
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for stoping user to publish the project in 
    *   case of publish-pending state in project model
    *   returns {object} data
    **/
    denyPublish: function (req, reply) {
        var query = {
            $and: [{
                _id: req.params.projectId
            }, {
                state: 'publish-pending'
            }]
        };
        Q.ninvoke(Project.findOneAndUpdate(query, {
            state: 'created',
            denyPublishReason: req.payload && req.payload.reason ? req.payload.reason : null
        }), 'exec')
            .then(function (updated) {
                if (!updated) {
                    var message = 'Project in an invalid state for publication';
                    return reply(Hapi.error.badRequest(message));
                }

                return Q.ninvoke(Project.findOne({
                    _id: updated._id
                }).populate('artist', 'email name contact'), 'exec');
            }).then(function (populated) {
                unagi.fire('project:deny-publish', {
                    project: populated
                });
                reply(populated);
            });
    },
    /**
    *   @name Controller:Projects.setState
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for setting project state as published and save in to the project model
    *   returns {object} data
    **/
    setState: function (req, reply) {
        var notify = false;
        Q.ninvoke(Project.findOne({
            _id: req.params.id
        }), 'exec').then(function (project) {
            if (project.state === 'published' && req.params.state === 'created') {
                notify = true;
            }

            return Q.ninvoke(Project.findByIdAndUpdate(req.params.id, {
                state: req.params.state
            }), 'exec');
        }).then(function (updated) {
            return Q.ninvoke(Project.findOne({
                _id: updated._id
            }).populate('artist', 'email name contact'), 'exec');
        }).then(function (populated) {
            if (notify) {
                unagi.fire('project:unpublished', {
                    project: populated
                });
            }
            reply(populated);
        }).fail(function (err) {
            console.log(err);
            reply(Hapi.error.internal('internal', err));
        });
    },
    /**
    *   @name Controller:Projects.faeture
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for retrieving the featured projects from project model
    *   returns {object} data
    **/
    faeture: function (req, reply) {
        Q.ninvoke(Project.findByIdAndUpdate(req.params.projectId, {
            featured: (req.params.onOff === 'true')
        }), 'exec')
            .then(function (updated) {
                reply(updated);
            });
    },
    /**
    *   @name Controller:Projects.markDeleted
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for updating the deleted status of project as deleted in project model
    *   returns {object} data
    **/
    markDeleted: function (req, reply) {
        Q.ninvoke(Project.findByIdAndUpdate(req.params.id, {
            deleted: new Date()
        }), 'exec')
            .then(function (updated) {
                reply(updated);
            });
    },
    /**
    *   @name Controller:Projects.revive
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for updating project in project model
    *   returns {object} data
    **/
    revive: function (req, reply) {
        Q.ninvoke(Project.findByIdAndUpdate(req.params.id, {
            deleted: null
        }), 'exec')
            .then(function (updated) {
                reply(updated);
            });
    },
    /**
    *   @name Controller:Projects.delete
    *   @function
    *   @param {object} req - Request object
    *   @param {interface} reply - hapi reply interface
    *   @description Used for removing the project from the project model
    *   returns {object} data
    **/
    delete: function (req, reply) {
        Project.findOne({
            _id: req.params.id
        }, function (err, project) {
            if (err) {
                return reply(Hapi.error.notFound());
            }

            project.remove(function (err) {
                if (err) {
                    return reply(Hapi.error.internal('internal', err));
                }
                reply().code(204);
            });

        });
    }

};
