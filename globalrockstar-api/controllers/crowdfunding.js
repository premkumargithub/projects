'use strict';
/**
 * @module Controller:crowdfunding
 *
 * @description Provides information about crowdfunding projects
 *
 * @requires module:mongoose
 * @requires module:hapi
 * @requires module:q
 * @requires module:lodash
 * @requires module:../lib/mongoose-hapi-errors
 * @requires module:../lib/paginator
 *
 */

var mongoose = require('mongoose');
var Hapi = require('hapi');
var Q = require('q');
var _ = require('lodash');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var paginator = require('../lib/paginator');
var Project = mongoose.model('Project');
var Artist = mongoose.model('Artist');
var Fan = mongoose.model('Fan');
var Payment = mongoose.model('Payment');

function shuffle(o) { //v1.0
    //for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {}
    return o;
}

function getDaysLeft(project) {
    if (!project.releaseDate) {
        return -1;
    }
    var today = new Date();
    var releaseDate = new Date(project.releaseDate);
    if (releaseDate < today) {
        return -1;
    }

    var oneDay = 24 * 60 * 60 * 1000;
    var diffDays = Math.round(Math.abs((today.getTime() - releaseDate.getTime()) / (oneDay)));
    return diffDays;
}

module.exports = {
    /**
     * Get information about all crowdfunding projects
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    index: function (req, reply) {
        var query = req.pre.search || {};

        query = {
            $and: [{
                deleted: null
            }, {
                $or: [{
                    state: 'published'
                }, {
                    state: 'completed'
                }, {
                    state: 'expired'
                }]
            },
                _.cloneDeep(query)
            ]
        };

        if (req.query.search) {
            var s = req.query.search;
            if (s.featured) {
                query.$and.push({
                    featured: true
                });
            }
            if (s.category) {
                query.$and.push({
                    category: s.category
                });
            }
            if (s.country) {
                query.$and.push({
                    _country: s.country
                });
            }
        }

        var mQuery = Project.find(query);
        // sorter(req, mQuery);
        if (req.query.sort) {
            mQuery.sort(req.query.sort);
        }

        paginator(req, mQuery);
        mQuery.populate('artist', 'slug name country picture');

        var itemCount;
        var projects;
        var today = new Date();

        Q.all([
            Q.ninvoke(Project.count(query), 'exec'),
            Q.ninvoke(mQuery, 'exec')
        ])
            .spread(function (count, prs) {
                itemCount = count;
                projects = prs;

                var qs = [];
                _.map(projects, function (pro) {
                    qs.push(Payment.moneyDonatedForProject(pro._id));
                });
                return Q.all(qs);
            })
            .then(function (pmts) {
                _.each(pmts, function (amountDonated, i) {
                    projects[i] = projects[i].toObject();
                    var project = projects[i];

                    project.moneyRaised = amountDonated.totalDollarAmount;
                    project.completed = projects[i].state === 'completed';
                    project.expired = projects[i].releaseDate < today;

                    project.percentDone = 0;
                    if (project.moneyRaised) {
                        var ratio = project.moneyRaised / project.moneyToRaise;
                        project.percentDone = Math.round(ratio * 100);
                    }
                    project.daysLeft = getDaysLeft(project);
                });

                reply({
                    items: projects,
                    itemCount: itemCount,
                    pages: Math.ceil((itemCount / req.pre.paginator.pagesize))
                });
            }).fail(function (err) {
                return reply(reformatErrors(err));
            });
    },

    /**
     * Get information about a specific crowdfunding project
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    detail: function (req, reply) {
        var start = new Date().getTime();

        var visitorId = req.query.visitor || null;
        var query = {
            $and: [{
                slug: req.params.slug
            }, {
                deleted: null
            }, {
                $or: [{
                    state: 'published'
                }, {
                    state: 'completed'
                }, {
                    state: 'expired'
                }]
            }]
        };
        var mQuery = Project.findOne(query);
        mQuery.populate('artist', '-salt -hashedPassword');

        var project;
        var visitorPayment;
        Q.ninvoke(mQuery, 'exec')
            .then(function (proj) {
                if (!proj) {
                    reply(Hapi.error.notFound());
                }

                project = proj.toObject();
                var visitorQry = {
                    $and: [{
                        'target.type': 'Project'
                    }, {
                        'target.project': project._id
                    }, {
                        state: 'completed'
                    }, {
                        $or: [{
                            'source.fan': visitorId,
                            'source.type': 'Fan'
                        }, {
                            'source.artist': visitorId,
                            'source.type': 'Artist'
                        }]
                    }]
                };
        
                return Q.all([
                    Payment.moneyDonatedForProject(project._id),
                    Q.ninvoke(Payment.findOne(visitorQry)
                            .select('-paymentFlow -userdata')
                            .populate('source.fan', 'firstname lastname email country picture slug')
                            .populate('source.artist', 'name contact.first_name contact.last_name email contact.country picture slug'),
                        'exec'),
                    Q.ninvoke(Project.find({
                        $and: [{
                            _id: {
                                $ne: project._id
                            }
                        }, {
                            artist: project.artist._id
                        }, {
                            deleted: null
                        }, {
                            $or: [{
                                state: 'published'
                            }, {
                                state: 'completed'
                            }, {
                                state: 'expired'
                            }]
                        }]
                    }).select('title slug teaserImage youtubeUrl state category'), 'exec')
                ]);

            }).spread(function (moneyDonated, _visitorPayment, _projects) {
                visitorPayment = _visitorPayment;

                project.otherProjects = _projects;

                var supporters = [];
                var filterHash = {};

                _.each(moneyDonated.backers, function (backer) {
                    if (backer.fan) {
                        filterHash[backer.fan] = backer;
                    }
                    if (backer.artist) {
                        filterHash[backer.artist] = backer;
                    }
                });

                project.moneyRaisedYet = moneyDonated.totalDollarAmount;
                project.percentDone = 0;
                if (project.moneyRaisedYet) {
                    var ratio = project.moneyRaisedYet / project.moneyToRaise;
                    project.percentDone = Math.round((ratio * 100));
                }

                project.daysLeft = getDaysLeft(project);
                project.numBackersByLevel = [
                    moneyDonated.backers_0,
                    moneyDonated.backers_1,
                    moneyDonated.backers_2,
                    moneyDonated.backers_3,
                    moneyDonated.backers_4
                ];

                _.each(filterHash, function (val, key) {
                    if (key) {
                        supporters.push(val);
                    }
                });

                project.numOfBackers = supporters.length;
                var shuffled = shuffle(supporters);
                supporters = _.first(shuffled, 8);

                var artistQuery = {};
                var fanQuery = {};
                _.each(supporters, function (sup) {
                    var query;
                    if (sup.artist) {
                        query = artistQuery;
                    } else {
                        query = fanQuery;
                    }

                    if (!query.$or) {
                        query.$or = [];
                    }

                    query.$or.push({
                        _id: sup.artist ? sup.artist : sup.fan
                    });
                });

                return Q.all([
                    artistQuery.$or ?
                        Q.ninvoke(Artist.find(artistQuery).select('name contact.first_name contact.last_name email contact.country picture slug'), 'exec') :
                        new Q([]),
                    fanQuery.$or ?
                        Q.ninvoke(Fan.find(fanQuery).select('firstname lastname email country picture slug'), 'exec') :
                        new Q([])
                ]);

            }).spread(function (artists, fans) {
                var supporters = [];
                _.each(artists, function (a) {
                    supporters.push(a);
                });
                _.each(fans, function (f) {
                    supporters.push(f);
                });

                supporters = shuffle(supporters);

                if (visitorPayment && !_.find(supporters, function (sup) {
                        return sup._id.toString() === visitorId;
                    })) {
                    var pos = Math.floor(Math.random() * 10) % 8;
                    supporters[pos] = (visitorPayment.source.artist ? visitorPayment.source.artist : visitorPayment.source.fan);
                }
                project.backers = supporters;

                project.completed = project.state === 'completed';
                var today = new Date();
                project.expired = project.releaseDate < today;

                reply(project);

                var end = new Date().getTime();
                var time = end - start;

            }).fail(function (err) {
                return reply(reformatErrors(err));
            });

    }
};
