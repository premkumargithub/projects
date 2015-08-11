'use strict';
/**
 *@module Controller:Support_Tickets
 *@description This modulle is used for providing services to suppport tickets activities
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:Video
 *@requires module:hapi
 *@requires module:../lib/mongoose-hapi-errors
 *@requires module:../lib/model-mapper
 *@requires module:../config
 *@requires module:../lib/event-emitter.js
 *@requires module:q
 *@requires module:node-redis-pubsub
 **/
var mongoose = require('mongoose');
var SupportTicket = mongoose.model('SupportTicket');
var Hapi = require('hapi');
var Q = require('q');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var ObjectId = mongoose.Types.ObjectId;
var findSupportTicket = Q.nbind(SupportTicket.findOne, SupportTicket);
var findSupportTickets = Q.nbind(SupportTicket.find, SupportTicket);
var config = require('../config');
var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);

/**
 * @function controller:support_tickets.errorCallback
 * @param {object} err Error type of object
 * @description This is used for reformating the error object
 * @returns {object}
 */
var errorCallback = function (err, reply) {
    return reply(reformatErrors(err));
};


module.exports = {
    /**
     * @name Controller:Support_Tickets.indexContest
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event is used for cheking the ticket Id from the session
     * then retrieve the support ticket from the findSupportTickets service
     * returns {object} object
     **/
    index: function (req, reply) {
        var query;
        if (req.params.id) {
            query = {
                $or: [{slug: req.params.id}]
            };

            if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({_id: req.params.id});
            }
            findSupportTickets(query)
                .then(function (support_ticket) {
                    if (!support_ticket) {
                        reply(Hapi.error.notFound());
                    } else {
                        reply(support_ticket);
                    }
                })
                .fail(errorCallback);

        } else {
            query = req.pre.search;

            findSupportTickets(query)
                .then(function (support_tickets) {
                    reply(support_tickets);
                })
                .fail(errorCallback);
        }
    },
    /**
     * @name Controller:Support_Tickets.create
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event is used instantiating the SupportTicket
     * save the support ticket object in to support_ticket model
     * returns {object} object
     **/
    create: function (req, reply) {
        var support_ticket = new SupportTicket(req.payload);
        support_ticket.save(function (err, obj) {
            if (!err) {
                unagi.emit('supporttickets:create', obj);

                reply(obj);
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
     * @name Controller:Support_Tickets.show
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event used for populating the query and fetch the support ticket in support_ticket model
     * returns {object} object
     **/
    show: function (req, reply) {
        var query = {
            $or: [{slug: req.params.id}]
        };

        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }
        findSupportTicket(query)
            .then(function (support_ticket) {
                if (!support_ticket) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(support_ticket);
                }
            })
            .fail(errorCallback);
    },
    /**
     * @name Controller:Support_Tickets.update
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event used for populating the query and updating the support ticket in support_ticket model
     * returns {object} object
     **/
    update: function (req, reply) {
        findSupportTicket({_id: req.params.id})
            .then(function (support_ticket) {
                if (!support_ticket) {
                    reply(Hapi.error.notFound());
                    return;
                }
                support_ticket.attrAccessible.forEach(function (attr) {
                    if (req.payload[attr]) {
                        support_ticket[attr] = req.payload[attr];
                    }
                });

                support_ticket.save(function (err, updated) {
                    if (err) {
                        return errorCallback(err);
                    }
                    reply(updated);
                });
            })
            .fail(errorCallback);

    },
    /**
     * @name Controller:Support_Tickets.delete
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description This event used for deleting the support ticket record from support_ticket model
     * returns {object} object
     **/
    delete: function (req, reply) {
        findSupportTicket({_id: req.params.id})
            .then(function (support_ticket) {
                if (!support_ticket) {
                    return reply(Hapi.error.notFound());
                }

                support_ticket.remove(function (err, project) {
                    if (err) {
                        return errorCallback(err);
                    }
                    reply({status: 'ok'});
                });
            })
            .fail(errorCallback);
    }
};
