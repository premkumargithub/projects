'use strict';
/** 
*@module Event:Global-Listner
*@description this modulle is used for amazon environment service
*Required modules are defined here
*@requires module:../config
*@requires module:node-redis-pubsub
**/

var config = require('../config'),
    nrp = require('node-redis-pubsub'),
    unagi = new nrp(config.redis);

module.exports = function () {
    //Checks node environment If it is amazon
    if (process.env.NODE_ENV == 'amazon') {
        unagi.on('*', function (event) {
            console.log('event:fired:%s', event.event);
        });
    }
};
