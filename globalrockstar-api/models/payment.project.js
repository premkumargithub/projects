'use strict';

var Q = require('q');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamps');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('lodash');

var nrp = require('node-redis-pubsub');
var config = require('../config');
var unagi = new nrp(config.redis);

module.exports = function (schema) {

    function listProjectPayments(projectId, populate) {

        var mQuery = mongoose.model('Payment').find({
            $and: [{
                'target.type': 'Project'
            }, {
                'target.project': projectId
            }, {
                'state': 'completed'
            }]
        }).sort({
            completed: 1
        });

        if (populate) {
            mQuery = mQuery
                .populate('source.fan', 'firstname lastname email country')
                .populate('source.artist', 'contact.first_name contact.last_name email contact.country');
        }

        return Q.ninvoke(mQuery, 'exec')
            .then(function (result) {
                var sum = {};
                var gpd = _.chain(result).groupBy('currency').each(function (item, key) {
                    sum[key] = _.reduce(item, function (s, it) {
                        return s + parseFloat(it.amount);
                    }, 0);
                });

                return {
                    payments: result,
                    sum: sum
                };
            });
    }

    function moneyDonatedForProject(projectId) {
        var dfd = Q.defer();

        var mQuery = [{
            $match: {
                "target.project": projectId
            }
        }, {
            $match: {
                "state": "completed"
            }
        }, {
            $match: {
                "target.type": "Project"
            }
        }, {
            $match: {
                "dollarAmount": {
                    $exists: 1
                }
            }
        }, {
            $project: {
                project: "$target.project",
                dollarAmount: '$dollarAmount',
                g1: {
                    $cond: {
                        'if': {
                            $lte: ['$dollarAmount', 10]
                        },
                        'then': 1,
                        'else': 0
                    }
                },
                g2: {
                    $cond: {
                        'if': {
                            $and: [{
                                $gt: ['$dollarAmount', 10]
                            }, {
                                $lte: ['$dollarAmount', 50]
                            }]
                        },
                        'then': 1,
                        'else': 0
                    }
                },
                g3: {
                    $cond: {
                        'if': {
                            $and: [{
                                $gt: ['$dollarAmount', 50]
                            }, {
                                $lte: ['$dollarAmount', 100]
                            }]
                        },
                        'then': 1,
                        'else': 0
                    }
                },
                g4: {
                    $cond: {
                        'if': {
                            $and: [{
                                $gt: ['$dollarAmount', 100]
                            }, {
                                $lte: ['$dollarAmount', 500]
                            }]
                        },
                        'then': 1,
                        'else': 0
                    }
                },
                g5: {
                    $cond: {
                        'if': {
                            $gt: ['$dollarAmount', 500]
                        },
                        'then': 1,
                        'else': 0
                    }
                },
                source: {
                    $cond: {
                        'if': {
                            $eq: ["$source.type", "Fan"]
                        },
                        'then': {
                            fan: "$source.fan"
                        },
                        'else': {
                            artist: "$source.artist"
                        }
                    }
                }
            }
        }, {
            $group: {
                _id: "$project",
                totalDollarAmount: {
                    $sum: '$dollarAmount'
                },
                backers_0: {
                    $sum: "$g1"
                },
                backers_1: {
                    $sum: "$g2"
                },
                backers_2: {
                    $sum: "$g3"
                },
                backers_3: {
                    $sum: "$g4"
                },
                backers_4: {
                    $sum: "$g5"
                },
                backers: { $push: "$source" }
            }
        }];

        Q.ninvoke(mongoose.model('Payment').aggregate(mQuery), 'exec')
            .then(function (result) {
                console.log(JSON.stringify(result, null, 2));
                if (!result.length) {
                    return dfd.resolve({
                        _id: projectId,
                        totalDollarAmount: 0,
                        backers_0: 0,
                        backers_1: 0,
                        backers_2: 0,
                        backers_3: 0,
                        backers_4: 0,
                        backers: []
                    });
                }
                return dfd.resolve(result[0]);
            })
            .fail(function (err) {
                console.error(err);
                return dfd.reject(err);
            });

        return dfd.promise;
    }

    function createListener(sourceType, sourceId, targetType, targetId, amount) {
        if (targetType !== 'Project') {
            return new Q();
        }

        var dfd = Q.defer();

        Q.ninvoke(mongoose.model('Project').findOne({
            _id: targetId
        }), 'exec')
            .then(function (proj) {
                if (!proj) {
                    return dfd.reject(new Error('No mathcing project found by id: ' + targetId));
                }
                if (proj.state !== 'published') {
                    return dfd.reject(new Error('Invalid project state: ' + proj.state));
                }
                if (proj.releaseDate && proj.releaseDate < new Date()) {
                    return dfd.reject(new Error('Invalid project state: ' + proj.state));
                }

                dfd.resolve();
            });

        return dfd.promise;
    }

    function commitListener(payment) {
        if (payment.target.type !== 'Project') {
            return new Q();
        }
        var dfd = Q.defer();

        // notify project paymnet

        var eventData = {
            fanId: payment.source.artist || payment.source.fan,
            fanType: payment.source.type.toLowerCase(),
            artist: payment.target.artist,
            project: payment.target.project,
            amount: payment.dollarAmount,
            currency: payment.currency
        };
        console.log('Notify artist:project:payment =>\n' + JSON.stringify(eventData, null, 2));
        unagi.fire('artist:project:payment', eventData);
        unagi.fire('project:payment:received', eventData);

        Q.all([
            Q.ninvoke(mongoose.model('Project').findOne({
                _id: payment.target.project
            }), 'exec'),
            listProjectPayments(payment.target.project),
            moneyDonatedForProject(payment.target.project)
        ]).spread(function (proj, pd, moneyDonated) {
            // set project completed if moneyToRaise sum reached
            if (moneyDonated.totalDollarAmount >= proj.moneyToRaise) {
                console.log('Project: ' + proj._id + ' completed with comit of payment: ' + payment._id);
                proj.state = 'completed';
                Q.ninvoke(proj, 'save')
                    .then(function () {
                        unagi.fire('project:completed', {
                            project: proj
                        });
                        dfd.resolve();
                    })
                    .fail(function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.resolve();
            }

        });

        return dfd.promise;
    }

    schema.statics.createListeners.push({
        name: 'ProjectCreateListener',
        handler: createListener
    });

    schema.statics.commitListeners.push({
        name: 'ProjectCommitListener',
        handler: commitListener
    });

    // Setup indices
    schema.index({
        'source.type': 1,
        'source.fan': 1,
        'target.artist': 1,
        'target.type': 1,
        'target.project': 1,
        'amount': 1,
        'completed': 1,
        'currency': 1
    });

    schema.statics.listProjectPayments = function (projectId, populate) {
        return listProjectPayments(projectId, populate);
    };

    schema.statics.moneyDonatedForProject = function (projectId) {
        return moneyDonatedForProject(projectId);
    };
};
