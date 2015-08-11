'use strict';

/**
 * @module Controller:contents
 *
 * @description Provides website's dynamic contents
 *
 * @requires module:mongoose
 * @requires module:hapi
 * @requires module:q
 * @requires module:../lib/mongoose-hapi-errors
 *
 */
var mongoose = require('mongoose');
var Content = mongoose.model('Content');
var Hapi = require('hapi');
var Q = require('q');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var findContent = Q.nbind(Content.findOne, Content);
var findContents = Q.nbind(Content.find, Content);

var errorCallback = function (err, reply) {
    return reply(reformatErrors(err));
};

module.exports = {
    /**
     * Get all the website's dynamic contents
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    index: function (req, reply) {
        if (req.params.id) {
            var query = {
                $or: [{slug: req.params.id}]
            };

            if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({_id: req.params.id});
            }
            findContents(query)
                .then(function (content) {
                    if (!content) {
                        reply(Hapi.error.notFound());
                    } else {
                        reply(content);
                    }
                })
                .fail(errorCallback);

        } else {
            var sort = req.query.sort || 'title';
            Content.find(req.pre.search).sort(sort).exec(function (err, contents) {
                reply(contents);
            });
        }
    },

    /**
     * Create a new content
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    create: function (req, reply) {
        var content = new Content(req.payload);
        content.save(function (err, obj) {
            if (!err) {
                reply(obj);
            } else {
                return reply(reformatErrors(err));
            }
        });
    },

    /**
     * Show a specific content given its id (req.params.id)
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    show: function (req, reply) {
        var query = {
            $or: [{slug: req.params.id}]
        };

        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }
        findContent(query)
            .then(function (content) {
                if (!content) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(content);
                }
            })
            .fail(errorCallback);
    },

    /**
     * Update a specific content
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    update: function (req, reply) {
        console.log(req.payload);
        findContent({_id: req.params.id})
            .then(function (content) {
                if (!content) {
                    reply(Hapi.error.notFound());
                    return;
                }
                content.attrAccessible.forEach(function (attr) {
                    content[attr] = req.payload[attr];
                });

                content.save(function (err, updated) {
                    if (err) {
                        return errorCallback(err);
                    }
                    reply(updated);
                });
            })
            .fail(errorCallback);

    },

    /**
     * Delete a specific content
     *
     * @param {object} req - Request object
     * @param {function} reply - hapi reply interface
     */
    delete: function (req, reply) {
        findContent({_id: req.params.id})
            .then(function (content) {
                if (!content) {
                    return reply(Hapi.error.notFound());
                }

                content.remove(function (err) {
                    if (err) {
                        return errorCallback(err);
                    }
                    reply({status: 'ok'});
                });
            })
            .fail(errorCallback);
    }
};
