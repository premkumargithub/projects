'use strict';
/**
 *@module Controller:Payments
 *@description decision maker for payments services
 *Required module define here
 *@requires module:mongoose
 *@requires module:Payment
 *@requires module:Project
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
var payPalController = require('./paypal');

module.exports = {
    /**
     * @name Controller:Payments.commitPayment
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It gets the paymentID from the request object
     * then Fetching data from Payment model according to the request payment id
     * and return based on the output
     * @return {object} success OR
     * @return {object} Failure
     *
     */
    commitPayment: function (req, reply) {
        Payment.lockForCommit(req.params.paymentId)
            .then(function () {
                return Payment.commit(req.params.paymentId);
            })
            .then(function (pmt) {
                return reply(pmt);
            })
            .fail(function (err) {
                console.warn('Maybe Payment was already comitted by IPN...');
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });
    },
    /**
     * @name Controller:Payments.abortPayment
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It gets the paymentID from the request object
     * then Fetching data from Payment model according to the request payment id
     * and return based on the output
     * @returns Sucess {object} OR
     * @returns  Error {Object}
     *
     */
    abortPayment: function (req, reply) {
        Payment.lockForCommit(req.params.paymentId)
            .then(function () {
                return Payment.abort(req.params.paymentId, req.payload);
            })
            .then(function (pmt) {
                return reply(pmt);
            })
            .fail(function (err) {
                console.warn('Maybe Payment was already aborted by IPN...');
                console.warn(err);
                console.warn(err.stack);
                Payment.getById(req.params.paymentId, true)
                    .then(function (pmt) {
                        return reply(pmt);
                    })
                    .fail(function (err) {
                        console.error(err);
                        console.error(err.stack);
                        return reply(Hapi.error.badRequest(err));
                    });
            });
    },
    /**
     * @name Controller:Payments.listArtistsPayments
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It checks the page number value and generate the paginator with start end limit off set
     * then Fetching data from Payment model according to the request artistId id and pagination
     * and return based on the output
     * @returns Sucess {object} OR
     * @returns  Error {Object}
     *
     */
    listArtistsPayments: function (req, reply) {
        var paginator;
        if (req.query.page) {
            paginator = {
                page: (parseInt(req.query.page, 10) - 1),
                pageSize: 50
            };
        }

        Payment.listArtistPayments(req.params.artistId, paginator)
            .then(function (pd) {
                return reply(pd);
            })
            .fail(function (err) {
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });
    },
    /**
     * @name Controller:Payments.listArtistPendingMobileVoteTransfers
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It gets the artist ID from Request object
     * then Fetching data from Payment model according to the request artistId id and pagination
     * and returns payment description to mobile
     * @returns Sucess {object} OR
     * @returns  Error {Object}
     *
     */
    listArtistPendingMobileVoteTransfers: function (req, reply) {
        Payment.listPossibleMobilePaymentTransfers(req.params.artistId)
            .then(function (pd) {
                return reply(pd);
            })
            .fail(function (err) {
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });
    },
    /**
     * @name Controller:Payments.transferMobileVotePendingPayments
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It gets the artist ID and currency from Request object
     * Create mobile vote transfer payment
     * @returns Sucess {object} OR
     * @returns  Error {Object}
     *
     */
    transferMobileVotePendingPayments: function (req, reply) {
        console.dir(req.payload);
        Payment.createMobileVoteTransferPayment(req.params.artistId, req.payload.currency)
            .then(function (pmt) {
                return payPalController.processPreapprovedPayment(req, reply, pmt);
            })
            .fail(function (err) {
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });
        // return reply(Hapi.error.badRequest(req.payload));
    },
    /**
     * @name Controller:Payments.listProjectPayments
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It fetch the projectId
     * then fetching the project payment list
     * @returns Sucess {object}
     *
     */
    listProjectPayments: function (req, reply) {
        Payment.listProjectPayments(req.params.projectId)
            .then(function (pd) {
                return reply(pd);
            })
            .fail(function (err) {
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });
    },
    /**
     * @name Controller:Payments.projectPaymentsCsvDownload
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It fetch projectId from req {object}
     * then prepare the JSON {object} and allow the user to download the CSV file
     * @returns null
     *
     */
    projectPaymentsCsvDownload: function (req, reply) {
        Payment.listProjectPayments(req.params.projectId, true)
            .then(function (pd) {
                //console.log('Payments => ');
                //console.log(JSON.stringify(pd.payments, null, 2));
                var rawData = _.map(pd.payments, function (pmt) {
                    return {
                        'E-Mail': pmt.source.fan ?
                            pmt.source.fan.email : pmt.source.artist ? pmt.source.artist.email : 'n/a',
                        'First name': pmt.source.fan ?
                            pmt.source.fan.firstname : pmt.source.artist ? pmt.source.artist.contact.first_name : 'n/a',
                        'Last name': pmt.source.fan ?
                            pmt.source.fan.lastname : pmt.source.artist ? pmt.source.artist.contact.last_name : 'n/a',
                        'Donated USD': pmt.dollarAmount.toFixed(2) + ' USD',

                        'Date': pmt.completed.toString(),
                        'Country': pmt.source.fan ?
                            pmt.source.fan.country : pmt.source.artist ? pmt.source.artist.contact.country : 'n/a',

                        'Net income': ' ' + pmt.shares.artist.toFixed(2) + ' ',
                        'Currency': pmt.currency
                    };
                });
                return Q.all([
                    Q.nfcall(csvStringify, rawData, {
                        header: 1,
                        delimiter: ';'
                    }),
                    Q.ninvoke(Project.findOne({
                        _id: req.params.projectId
                    }, {
                        slug: 1
                    }), 'exec')
                ]);
            }).spread(function (csvStr, project) {
                reply(csvStr)
                    .header('Content-disposition', 'attachment; filename=' + new Date().toDateString() + '-GlobalRockstar-Project-' + project.slug + '.csv')
                    .type('text/csv')
                    .charset('UTF-8');
            }).fail(function (err) {
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });
    },
    /**
     * @name Controller:Payments.createPayment
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It fetch payload, dollarAmount, exchangeRate and remove dollarAmount, exchangeRate from userdata {object}
     * then create payment based on the request {object}
     * @returns Sucess {object} OR
     * @returns Failure {object}
     *
     */
    createPayment: function (req, reply) {
        var userdata = req.payload;
        var dollarAmount = userdata.dollarAmount;
        var exchangeRate = userdata.exchangeRate;
        delete userdata.dollarAmount;
        delete userdata.exchangeRate;
        Payment.createPayment(req.params.sourceType, req.params.sourceId, req.params.targetType, req.params.targetId, req.params.amount, userdata, dollarAmount, exchangeRate)
            .then(function (pmt) {
                return reply(pmt).code(201);
            })
            .fail(function (err) {
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });
    },
    /**
     * @name Controller:Payments.checkForeignCurrency
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description It fetch the artistId, targetType and data {object}
     * then either currency is foreign
     * @returns Sucess {object}
     *
     */
    checkForeignCurrency: function (req, reply) {
        Payment.checkForeignCurrency(req.params.artistId, req.params.targetType, req.params.data)
            .then(function (pmt) {
                return reply(pmt).code(200);
            })
            .fail(function (err) {
                console.error(err);
                console.error(err.stack);
                return reply(Hapi.error.badRequest(err));
            });

    }
};
