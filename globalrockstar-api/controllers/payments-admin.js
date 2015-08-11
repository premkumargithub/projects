'use strict';
/**
 *@module Controller:Payment-Admin
 *@description decision make handler for Admin payments activities
 *Required module define here
 *@requires module:mongoose
 *@requires module:hapi
 *@requires module:q
 *@requires module:node-redis-pubsub
 *@requires module:../config
 *@requires module:../lib/mongoose-hapi-errors
 *@requires module:csv-stringify
 *@requires module:lodash
 **/
var mongoose = require('mongoose');
var Payment = mongoose.model('Payment');
var Project = mongoose.model('Project');
var Hapi = require('hapi');
var Q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var nrp = require('node-redis-pubsub');
var config = require('../config');
var unagi = new nrp(config.redis);
var reformatErrors = require('../lib/mongoose-hapi-errors');
var csvStringify = require('csv-stringify');
var _ = require('lodash');

module.exports = {
    /**
     * @name Controller:Payment-Admin.index
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It checks type(ARTISTID) from session
     * then Fetching data from Payment model according to the query made from params and
     * populate the songs object and provide to user
     *
     */
    index: function (req, reply) {

        var query = req.pre.search || {};

        if (req.params.artistId) {
            query.artist = req.params.artistId;
        }

        var sortBy = req.query.sort || '-createdAt';

        req.query.page = req.query.page || 0;
        req.query.page = req.query.page > 0 ? req.query.page - 1 : 0;

        var page = req.query.page;
        var pageSize = req.query.pagesize || 15;

        Q.all([
            Payment.count(query).exec(),
            Payment.find(query).sort(sortBy).skip(pageSize * page).limit(pageSize).exec()
        ])
            .then(function (songs) {

                Payment.populate(songs[1], [
                    {path: 'target.artist', model: 'Artist'},
                    {path: 'target.project', model: 'Project'},
                    {path: 'target.voucher', model: 'Voucher'},
                    {path: 'target.vote', model: 'Vote'},

                    {path: 'source.artist', model: 'Artist'},
                    {path: 'source.voucher', model: 'Voucher'},
                    {path: 'source.fan', model: 'Fan'}

                ], function (err, payments) {
                    console.log(payments);
                    reply({
                        pages: Math.ceil((songs[0] / pageSize) * 10) / 10,
                        payments: payments
                    });
                });
            })
            .fail(function (err) {
                console.log(err);
            });


    },
    /**
     * @name Controller:Payment-Admin.show
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It checks grab payment ID from the session
     * then Fetching data for payment details according to requested payment ID and provides to user
     **/
    show: function (req, reply) {
        //Get payment object from Payment model
        Payment.findOne({_id: req.params.id}).exec(function (err, payment) {
            if (!payment) {
                return reply(Hapi.error.notFound());
            }
            reply(payment);
        });

    }

};
