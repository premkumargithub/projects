/* globals describe, it, before, after, beforeEach, afterEach */

'use strict';

var config = require('../../lib/database'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    _ = require('lodash');

var ObjectId = mongoose.Types.ObjectId;

var models = [
    'Artist',
    'ChartEntry',
    'Content',
    'Contest',
    'Fan',
    'Payment',
    'Project',
    'Slider',
    'Song',
    'SupportTicket',
    'Video',
    'Vote'
];

// Empty all the collections listed above
function resetDB() {
    return Q.all(_.map(models, function (model) {
        return Q.ninvoke(mongoose.model(model).collection, 'remove');
    }));
}

module.exports = {
    resetDB: resetDB
};
