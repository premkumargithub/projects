'use strict';
/**
 *@module Controller:Paypal
 *@description this modulle is used for paypal activities
 *Required modules are defined here
 *@requires module:querystring
 *@requires module:lodash
 *@requires module:hapi
 *@requires module:../config
 *@requires module:request
 *@requires module:q
 *@requires module:../models/payment
 *@requires module:paypal-adaptive
 *@requires module:../public/configs/country2currency.json
 *@requires module:../public/configs/currencies.json
 **/
var querystring = require('querystring');
var _ = require('lodash');
var Hapi = require('hapi');
var config = require('../config');
var request = require('request');
var Q = require('q');
var Payment = require('../models/payment');
var PayPal = require('paypal-adaptive');
var qs = require('querystring');

var sdk = new PayPal(config.payPal.defaultAccount);
var country2currency = require('../public/configs/country2currency.json');
var currencies = require('../public/configs/currencies.json');

/**
 * @function
 * @name Controller:Paypal.getVerifiedStatusRequestData
 * @param {String} email Paypal email ID
 * @param {String} firstname User first name
 * @param {String} lasttname User last name
 * @description This is used for checking either paypal request is verified
 * @returns {object} success
 */
var getVerifiedStatusRequestData = function (email, firstname, lastname) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        emailAddress: email,
        firstName: firstname,
        lastName: lastname,
        matchCriteria: 'NAME'
    };
};

/**
 * @function
 * @name Controller:Paypal.getTryChainedPayment
 * @param {String} email Paypal email ID
 * @param {String} currency currency for the ammout
 * @description This is used for making the request object for chained payment
 * @returns {object} success
 */
var getTryChainedPayment = function (email, currency) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        actionType: 'PAY',
        currencyCode: currency,
        feesPayer: 'SECONDARYONLY',
        memo: 'GlobalRockstar',
        reverseAllParallelPaymentsOnError: true,
        cancelUrl: 'http://lvh.me/payments/-1/abort',
        returnUrl: 'http://lvh.me/payments/-1/commit',
        receiverList: {
            receiver: [{
                email: email,
                amount: 2,
                primary: 'true',
                paymentType: 'DIGITALGOODS'
            }, {
                email: config.payPal.defaultAccount.grPayPalEmail,
                amount: '1',
                primary: 'false',
                paymentType: 'DIGITALGOODS'
            }]
        }
    };
};

/**
 * @function
 * @name Controller:Paypal.getCheckCurrencyData
 * @param {String} email Paypal email ID
 * @param {String} currency currency for the ammout
 * @description This is used for checking currency data
 * @returns {object} success
 */
var getCheckCurrencyData = function (email, currency) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        actionType: 'CREATE',
        currencyCode: currency,
        feesPayer: 'SENDER',
        memo: 'GlobalRockstar',
        cancelUrl: 'https://test.uri/payments/0/abort',
        returnUrl: 'https://test.uri/payments/0/paypal-success',
        receiverList: {
            receiver: [{
                email: email,
                amount: 1
            }]
        }
    };
};

/**
 * @function
 * @name Controller:Paypal.checkAccountExists
 * @param {String} email Paypal email ID
 * @param {String} firstname User first name
 * @param {String} lasttname User last name
 * @description This is used for checking either paypal account exist or not
 * @return {object} success
 */
function checkAccountExists(email, firstName, lastName) {
    var payload = getVerifiedStatusRequestData(email, firstName, lastName);
    console.log(JSON.stringify(payload, null, 2));
    var dfd = Q.defer();
    sdk.getVerifiedStatus(payload, function (err, response) {
        if (err) {
            console.error('PayPal Error =>');
            console.error(JSON.stringify(err, null, 2));
            var msg = '- NOT VERIFIED';
            if (response) {
                console.error(JSON.stringify(response, null, 2));
                msg += '\n--- errorId: ' + response.error[0].errorId;
                msg += '\n--- message: ' + response.error[0].message;
            }
            return dfd.reject(msg);
        }
        dfd.resolve('- VERIFIED');
    });
    return dfd.promise;
}

/**
 * @function
 * @name Controller:Paypal.checkAcceptsCurrency
 * @param {String} email Paypal email ID
 * @param {String} currency currency for the ammout
 * @description This is used for checking either paypal account exist or not
 * @return {object} success
 */
function checkAcceptsCurrency(email, currency) {
    // var payload = getCheckCurrencyData(email, currency);
    var payload = getTryChainedPayment(email, currency);
    console.log(JSON.stringify(payload, null, 2));
    var dfd = Q.defer();
    sdk.pay(payload, function (err, response) {
        if (err) {
            console.error('PayPal Error =>');
            console.error(JSON.stringify(err, null, 2));
            var msg = '- NOT ACCEPTING: ' + currency;
            if (response) {
                console.error(JSON.stringify(response, null, 2));
                msg += '\n--- errorId: ' + response.error[0].errorId;
                msg += '\n--- message: ' + response.error[0].message;
            }
            return dfd.reject(msg);
        }
        dfd.resolve('- ACCEPTS: ' + currency);
    });
    return dfd.promise;
}

/**
 * @function
 * @name Controller:Paypal.finishFlow
 * @param {object} request Request object
 * @param {interface} reply hapi reply interface
 * @param {ObjectId} payment Payment ID
 * @description This is used for finishing the payment flow for user
 * @return {object}
 */
function finishFlow(req, reply, paymentId) {
    var dfd = Q.defer();
    var payment;
    Payment.getById(paymentId, true)
        .then(function (_payment) {
            payment = _payment;
            console.log('Request lock for payment: ' + payment.id);
            return Payment.lockForCommit(paymentId);
        })
        .then(function (pmt) {
            return require('./paypal-' + pmt.paymentType).finish(req, reply, pmt);
        })
        .fail(function (err) {
            if (payment) {
                console.log('Commit lock not granted!');
                console.log(err);
                return reply(payment).code(200);
            }
            console.error("API Error => ");
            console.error(err);
        });
}

/**
 * @function
 * @name Controller:Paypal.abortFlow
 * @param {object} request Request object
 * @param {interface} reply hapi reply interface
 * @param {ObjectId} payment Payment ID
 * @param {object} data payment object
 * @description This is used for aborting the payment flow for user
 * @return {object}
 */
function abortFlow(req, reply, paymentId, data) {
    var payment;
    Payment.getById(paymentId, true)
        .then(function (_payment) {
            payment = _payment;
            console.log('Request lock for payment: ' + payment.id);
            return Payment.lockForCommit(paymentId);
        })
        .then(function (pmt) {
            return Payment.abort(paymentId, data);
        })
        .then(function (updated) {
            return reply(payment).code(200);
        })
        .fail(function (err) {
            if (payment) {
                console.log('Commit lock not granted!');
                console.log(err);
                return reply(payment).code(200);
            }
            console.error("API Error => ");
            console.error(err);
        });
}

module.exports = {
    /**
     * @function
     * @name Controller:Paypal.processPreapprovedPayment
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for populating the preapproved payment flow
     * @return {object} object
     */
    processPreapprovedPayment: function (req, reply, paymentId) {
        console.log("PROCESSING PREAPPROVED PAYMENT!");
        Payment.getById(paymentId)
            .then(function (pmt) {
                if (pmt.paymentType !== 'preapproved') {
                    var err = {
                        error: 'Invalid Payment Type! For Paypal controller processPreapprovedPayment!'
                    };
                    Payment.abort(paymentId, err)
                        .then(function () {
                            console.error(err);
                            reply(err).code(500);
                        });
                    return;
                }
                console.log('Got pmt: ' + pmt._id);
                return require('./paypal-preapproved').init(req, reply, pmt);
            })
            .fail(function (err) {
                console.log('Got API ERROR => ');
                console.error(err);
                reply(err).code(500);

            });

    },
    /**
     * @function
     * @name Controller:Paypal.initPayPalFlow
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for initiating the paypal payment flow
     * @return {object} object
     */
    initPayPalFlow: function (req, reply) {
        var paymentId;
        Payment.getById(req.params.paymentId)
            .then(function (pmt) {
                console.log('Got pmt: ' + pmt._id);
                return require('./paypal-' + pmt.paymentType).init(req, reply, pmt);
            })
            .fail(function (err) {
                console.log('Got API ERROR => ');
                console.error(err);
                reply(err).code(500);

            });
    },
    /**
     * @function
     * @name Controller:Paypal.finishPayPalFlow
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for finishing the paypal process
     * @return {object} object
     */
    finishPayPalFlow: function (req, reply) {
        var paymentId = req.params.paymentId;
        var payment;

        console.log('Finish PayPal flow from UI');
        finishFlow(req, reply, paymentId);
    },
    /**
     * @function
     * @name Controller:Paypal.finishPayPalFlowIPN
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for finishing the paypal IPN process
     * @return {object} object
     */
    finishPayPalFlowIPN: function (req, reply) {
        console.log('IPN => ');
        console.log(req.payload.ipn);
        var ipn = qs.parse(req.payload.ipn);
        console.log('Parsed IPN => ');
        console.log(JSON.stringify(ipn, null, 2));

        var paymentId = ipn.tracking_id;
        if (!paymentId) {
            console.error('WARNING: received IPN without tracking_id!');
            return;
        }

        Payment.pushFlowData(paymentId, {
            receivedIPNFromPayPal: {
                ipnRaw: req.payload.ipn
            }
        });

        if (ipn.status === 'COMPLETED') {
            console.log('Finish PayPal flow from IPN');
            finishFlow(req, reply, paymentId);
        } else {
            abortFlow(req, reply, paymentId, {
                reason: 'IPN status != "COMPLETED"',
                ipnRaw: req.payload.ipn
            });
        }
    },
    /**
     * @function
     * @name Controller:Paypal.getAccountState
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for retrieving the paypal account state
     * @return {object} object
     */
    getAccountState: function (req, reply) {
        console.log("getAccountState ");
        if (!req.payload.email || !req.payload.firstName || !req.payload.lastName) {
            return reply(Hapi.error.badRequest('email, firstName and lastName are required!'));
        }
        console.log('Check if account exists...');
        var log = [];

        checkAccountExists(req.payload.email, req.payload.firstName, req.payload.lastName)
            .then(function (msg) {
                console.log(msg);
                //log.push(msg);
                console.log("Check if accepting EUR & USD...");
                return Q.allSettled([
                    checkAcceptsCurrency(req.payload.email, 'EUR'),
                    checkAcceptsCurrency(req.payload.email, 'USD')
                ]);
            }).then(function (res) {
                // console.dir(res);

                var err = {};

                if (res[0].state === 'fulfilled') {
                    log.push(res[0].value);
                } else {
                    log.push(res[0].reason);
                    err.euroFailed = true;
                }

                if (res[1].state === 'fulfilled') {
                    log.push(res[1].value);
                } else {
                    log.push(res[1].reason);
                    err.dollarFailed = true;
                }

                if (res[0].state !== 'fulfilled' || res[1].state !== 'fulfilled') {
                    console.log("Sening currency error response =>");
                    console.dir(log);
                    reply({
                        err: err
                    }).code(400);
                } else {
                    console.log("Sending ok => ");
                    console.dir(log);
                    reply({}).code(200);
                }
            }).fail(function (msg) {
                log.push(msg);
                console.log("Sening verified error response =>");
                reply({
                    err: {
                        verifyFailed: true
                    }
                }).code(400);
            });

    },
    /**
     * @function
     * @name Controller:Paypal.getAccountVerified
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for checking account is verified from paypal
     * @return {object} object
     */
    getAccountVerified: function (req, reply) {
        console.log("getAccountVerified ");
        if (!req.payload.email || !req.payload.firstName || !req.payload.lastName) {
            return reply(Hapi.error.badRequest('email, firstName and lastName are required!'));
        }
        //console.log();
        var log = [];
        log.push('Check PayPal account artist: ' + req.payload.artistId + ' verified: ' + req.payload.email + ' firstName: ' + req.payload.firstName + ' lastName: ' + req.payload.lastName);
        checkAccountExists(req.payload.email, req.payload.firstName, req.payload.lastName)
            .then(function () {
                log.push('- Account is Verified :)');
                console.log(log.join('\n'));
                reply({}).code(200);
            }).fail(function (msg) {
                log.push(msg);
                console.error(log.join('\n'));
                console.log("Sening verified error response =>");
                reply({
                    err: {
                        verifyFailed: true
                    }
                }).code(400);
            });
    },
    /**
     * @function
     * @name Controller:Paypal.getDefaultCurrencyGuess
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for checking the paypal email and currency from session req object
     * then check currency is acceptable or not
     * @return {object} error
     */
    getDefaultCurrencyGuess: function (req, reply) {
        console.log("getDefaultCurrencyGuess ");

        if (!req.payload.email || !req.payload.country) {
            return reply(Hapi.error.badRequest('email and country are required!'));
        }

        //log.push('Check PayPal account artist: ' + req.payload.artistId + ' verified: ' +  req.payload.email + ' firstName: ' + req.payload.firstName + ' lastName: ' + req.payload.lastName);
        var checkedCur = ['USD', 'EUR'];
        var checks = [
            checkAcceptsCurrency(req.payload.email, 'USD'),
            checkAcceptsCurrency(req.payload.email, 'EUR')
        ];

        var nativeCurr = country2currency[req.payload.country];
        if (nativeCurr && nativeCurr !== 'EUR' && nativeCurr !== 'USD') {
            checks.push(checkAcceptsCurrency(req.payload.email, nativeCurr));
            checkedCur.push(nativeCurr);
        }
        _.each(currencies, function (cur) {
            console.dir(cur);
            if (cur.code !== 'USD' && cur.code !== 'EUR' && (!nativeCurr || cur.code !== nativeCurr)) {
                checks.push(checkAcceptsCurrency(req.payload.email, cur.code));
                checkedCur.push(cur.code);
            }
        });

        Q.allSettled(checks)
            .then(function (checked) {
                var ret = {};
                ret.accepted = [];
                for (var i = 0; i < checked.length; i++) {
                    var curr = checkedCur[i];
                    if (checked[i].state === 'fulfilled') {
                        if (!ret.currency) {
                            ret.currency = _.find(currencies, function (c) {
                                return c.supported && c.code === curr;
                            });
                        }
                        ret.accepted.push(_.find(currencies, function (c) {
                            return c.code === curr;
                        }));
                    }
                }

                ret.supported = _.filter(currencies, function (cur) {
                    return cur.supported;
                });

                console.log('PayPal artist: ' + req.payload.artistId + ' account: ' + req.payload.email + ' accepts => ' + JSON.stringify(ret.accepted));
                if (!ret.currency) {
                    console.error('PayPal artist: ' + req.payload.artistId + ' account: ' + req.payload.email + ' accepts => ' + JSON.stringify(ret.accepted));
                    console.error('--- No supported currency found!');
                    reply(ret).code(403);
                } else {
                    reply(ret).code(200);
                }
            });
    },
    /**
     * @function
     * @name Controller:Paypal.getAcceptsCurrency
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for checking the paypal email and currency from session req object
     * then check currency is acceptable or not
     * @return {object} error
     */
    getAcceptsCurrency: function (req, reply) {
        if (!req.payload.email || !req.payload.currency) {
            return reply(Hapi.error.badRequest('email and currency are required!'));
        }
        console.log('Check if account: ' + req.payload.email + ' accepts payments in: ' + req.payload.currency);
        var log = [];
        console.dir(req.payload);
        checkAcceptsCurrency(req.payload.email, req.payload.currency)
            .then(function () {
                console.log("Sending ok => ");
                console.dir(log);
                reply({}).code(200);
            }).fail(function (msg) {
                log.push(msg);
                console.log("Sening currency error response =>");
                reply({
                    err: {
                        currencyFailed: true,
                        currency: req.payload.currency
                    }
                }).code(400);
            });
    },
    checkAccountExists: checkAccountExists,
    checkAcceptsCurrency: checkAcceptsCurrency

};
