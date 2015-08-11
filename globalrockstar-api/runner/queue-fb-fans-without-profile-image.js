'use strict';

/**
 * searches for fans that do not have a profile image but a facebookid
 * and enqueues them for processing
 *
 */

var Fan = require('../models/fan');
var config = require('../config'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp(config.redis);

require('../lib/database');

function process(fans) {
    if (fans.length === 0) return console.log('finished');
    var fan = fans.pop();

    unagi.q.create('fan:profile-image:get', {
        _id: fan._id
    }).attempts(3).save(function (err) {
        if (err) { console.error(err)}
        process(fans);
    });
}

Fan.find({
    facebookId: {
        $exists: true
    },
    $or: [{
        picture: {
            $exists: false
        }
    }, {
        picture: ''
    }]
}, {
    _id: 1
}, function (err, fans) {
    process(fans);
});
