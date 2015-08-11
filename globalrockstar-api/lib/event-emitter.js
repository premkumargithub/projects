'use strict';

/**
 * @module Lib:event-emitter
 *
 * @description Return a new instance of EventEmitter
 *
 * @requires module:events
 */

var EventEmitter = require('events').EventEmitter;
module.exports = new EventEmitter();
