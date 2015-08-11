'use strict';

/**
 * @module Lib:agenda
 *
 * @description Start a new instance of agenda
 *
 * @requires module:agenda
 * @requires module:../config
 */

// FIXME: Seems that Agenda is never used in this repo. Can we remove it?
var Agenda = require('agenda') ;
var config = require('../config') ;
var agenda = new Agenda({db: { address: config.agenda.db , collection: config.agenda.collection }});

// Start agenda (job scheduler)
agenda.start() ;

module.exports = agenda;