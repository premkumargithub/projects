'use strict';

var Q = require('q');
var nrp = require('node-redis-pubsub');
var config = require('../../config');

/**
 * Capture a singe event, unsubscribe call the assertion and then done()  
 */
function spy(eventName, assert, done) {
    console.log("----------------------------------------------------Spy on event: " + eventName);
    var lsnr = new nrp(config.redis);
    console.log("------------------------------------Cofigure redis client =>");
    console.dir(config.redis);
    lsnr.on(eventName, function (data) {
        console.log("----------------------------------received: " + eventName + " quit listener!");
        lsnr.quit();
        new Q(assert(data.event, data.payload))
            .then(function () {
                done();
            })
            .fail(function (error) {
                console.error(error);
                done(error);
            });
    });

    return lsnr;
}

/**
 * Capture all events until manually calling quit on the retuened listener object (=redisClient)
 * captured events are available using the capturedEvents property of the return value
 */
function capture(eventName, eventReceived) {
    var lsnr = new nrp(config.redis);
    var capturedEvents = [];
    lsnr.on(eventName, function (data) {
        capturedEvents.push(data);
        if (eventReceived) {
            eventReceived(data.event, data.payload);
        }
    });

    return {
        listener: lsnr,
        capturedEvents: capturedEvents
    };
}

module.exports = {
    spy: spy,
    capture: capture,
};
