/**
 * Provides routes for Support-tickets ralated activities
 *
 * @module Routes:Support-ticket
 * @requires module:../controllers/support_tickets
 * @requires module:../lib/pre-search-query
 * @requires module:joi
 */

var SupportTicketController = require('../controllers/support_tickets'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    preSearchQuery = require('../lib/pre-search-query'),
    Joi = require('joi');

/**
 * @namespace
 * @name Routes:Support-ticket.createSchema
 * @desc Create the schema for SupportTicket table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var createSchema = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().required(),
    category: Joi.string().required(),
    message: Joi.string().required()
}).options({abortEarly: false, allowUnknown: true});

module.exports = function (server) {
    server.route([
        {
            method: 'GET',
            path: '/support_tickets',
            handler: SupportTicketController.index,
            config: {
                pre: preSearchQuery
            }
        },
        {
            method: 'POST',
            path: '/support_tickets',
            handler: SupportTicketController.create,
            config: {
                validate: {
                    payload: createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        {
            method: 'GET',
            path: '/support_tickets/{id}',
            config: {
                handler: SupportTicketController.show
            }
        },
        {
            method: 'PUT',
            path: '/support_tickets/{id}',
            config: {
                handler: SupportTicketController.update,
                validate: {
                    payload: createSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        {
            method: 'DELETE',
            path: '/support_tickets/{id}',
            config: {
                handler: SupportTicketController.delete
            }
        }
    ]);
};
