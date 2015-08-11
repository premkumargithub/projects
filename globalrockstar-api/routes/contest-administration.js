'use strict';

/**
 * @module Routes:contest-administration
 *
 * @description Provides routes to read and update information about contents
 *
 * @requires module:../controllers/contents
 * @requires module:../controllers/contests-administration
 */

var ContestsController = require('../controllers/contests'),
    //Joi = require('joi'),
    ContestAdministrationController = require('../controllers/contests-administration');

module.exports = function (server) {

    // Bootstrap contest
    server.route({
        method: 'GET',
        path: '/contests/{id}/bootstrap',
        config: {
            pre: [{method: ContestsController.show, assign: 'contest'}],
            handler: ContestAdministrationController.bootstrap
        }
    });

    // Move contest to another phase
    server.route({
        method: 'PUT',
        path: '/contests/{id}/transfer',
        config: {
            pre: [{method: ContestsController.show, assign: 'contest'}],
            handler: ContestAdministrationController.transfer
        }
    });

    // Normalize votes
    server.route({
        method: 'PUT',
        path: '/contests/{id}/normalize',
        config: {
            pre: [{method: ContestsController.show, assign: 'contest'}],
            handler: ContestAdministrationController.normalize
        }
    });

    // Set wildcards on contest
    server.route({
        method: 'PUT',
        path: '/contests/{id}/set-wildcards',
        config: {
            pre: [{method: ContestsController.show, assign: 'contest'}],
            handler: ContestAdministrationController.setWildcards
        }
    });
};
