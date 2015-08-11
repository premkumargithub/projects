'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    Fan = mongoose.model('Fan'),
    _ = require('lodash');

function fanFactory() {
    return new Fan({
        _id: ObjectId(),
        provider: 'local',
        name: 'Fake Fan',
        email: ObjectId().toString() + 'projecttest@test.com',
        password: 'password123456',
        password_confirmation: 'password123456',
        toc: true,
        newsletter: true
    });
}



function validFan() {
    return new Q(fanFactory());
}

function savedFan(cb) {
    var fan;
    return validFan()
        .then(function(a) {
            fan = a;
            return Q.ninvoke(fan, 'save');
        })
        .then(function () {
            return Q.ninvoke(Fan.findOne({
                _id: fan._id
            }), 'exec');
        }).nodeify(cb);
}

module.exports = {
    validFan: validFan,
    savedFan: savedFan
};
