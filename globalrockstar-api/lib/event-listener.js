'use strict';

/**
 * @module Lib:event-listener
 *
 * @description Initialize a listener for the following events: * artist:statechange, fan:statechange, song:statechange, song:play * calling the matching callbacks
 *
 * @requires module:./event-emitter
 * @requires module:../mailer/user-state-change
 * @requires module:../mailer/song-state-change
 * @requires module:./song-count-plays
 */


var emitter = require('./event-emitter.js');
var userStateChange = require('../mailer/user-state-change') ;
var songStateChange = require('../mailer/song-state-change') ;
var songCountPlays = require('./song-count-plays') ;

module.exports = function () {
    emitter.on('artist:statechange', userStateChange);
    emitter.on('fan:statechange', userStateChange) ;
    emitter.on('song:statechange', songStateChange) ;
    emitter.on('song:play', songCountPlays) ;
};
