'use strict';

var myrepl = require('repl').start({});
var config = require('../config');
var mongoose = require('mongoose');

mongoose.connect(config.db);

myrepl.context.lodash = require('lodash');
myrepl.context.l = console.log;
myrepl.context.m = mongoose;
myrepl.context.s = function (err, obj) {
    if (err) return console.error(err);
    myrepl.context.obj = obj;
};

var nrp = require('node-redis-pubsub'),
    config = require('../config'),
    unagi = new nrp( config.redis );

myrepl.context.unagi = unagi;

['artist', 'fan', 'song', 'project', 'badge', 'contest', 'voucher-template', 'vote', 'voucher'].forEach(function (modName) {
    myrepl.context[modName.replace('-', '')] = require('../models/' + modName);
});
