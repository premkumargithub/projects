'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    Contest = mongoose.model('Contest'),
    _ = require('lodash');

function contestFactory() {
    return new Contest({
        name: "Test Contest",

        cfe: {
            time: {
                start: new Date(1980, 1, 1),
                end: new Date(2040, 1, 1)
            }
        },
        np: {
            time: {
                start: new Date(1980, 1, 1),
                end: new Date(2040, 1, 1)
            }
        },
        globalfinalsBest16: {
            time: {
                start: new Date(2040, 1, 1),
                end: new Date(2041, 1, 1)
            }
        }

    });
}

function validContest() {
    return new Q(contestFactory());
}

function savedContest(cb) {
    Q.longStackSupport = true;

    var contest = contestFactory();
    return Q.ninvoke(contest, 'save')
        .then(function () {
            return Q.ninvoke(Contest.findOne({
                _id: contest._id
            }), 'exec');
        })
        .fail(function (error) {
            console.error(error);
        })
        .nodeify(cb);
}

module.exports = {
    validContest: validContest,
    savedContest: savedContest,
};
