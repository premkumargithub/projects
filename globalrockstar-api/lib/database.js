'use strict';

/**
 * @module Lib:database
 *
 * @description Provides connection to DB
 *
 * @requires module:mongoose
 * @requires module:../config
 */
// FIXME: Seems that database is never used in this repo. Can we remove it?
var mongoose = require('mongoose');
mongoose.connect(require('../config').db);