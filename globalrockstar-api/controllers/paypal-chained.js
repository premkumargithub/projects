'use strict';
/**
 *@module Controller:Paypal-Chained
 *@description decision maker controller for Chained paypal method
 *Required module define here for this controller
 *@requires module:lodash
 *@requires module:hapi
 *@requires module:../config
 *@requires module:request
 *@requires module:q
 *@requires module:paypal-adaptive
 *@requires module:node-redis-pubsub
 **/
var _ = require('lodash');
var Hapi = require('hapi');
var config = require('../config');
var request = require('request');
var Q = require('q');
var Payment = require('../models/payment');
var PayPal = require('paypal-adaptive');
var nrp = require('node-redis-pubsub');
var unagi = new nrp(config.redis);

/**
 * This is a description of the Currency Name function.
 * @name Controller:Paypal-Chained.currencyName
 * @function
 * @param {string} - Currency
 * @functiondesc: It checks type(currency)
 * @return {string} - Currency
 */
function currencyName(currency) {
    if (currency === 'euro') {
        console.warn("USING LEGACY CURRYNCY NAME: " + currency);
        return 'EUR';
    }
    if (currency === 'dollar') {
        console.warn("USING LEGACY CURRYNCY NAME: " + currency);
        return 'USD';
    }
    return currency;
}

/**
 * This is a description of getSDK function.
 * @function
 * @name Controller:Paypal-Chained.getSDK
 * @param {object} - Payment
 * @functiondesc: It instantiate the Paypal SDK class object
 * @return {object}
 */
function getSDK(pmt) {
    return new PayPal(pmt.payPalAccount);
}

/**
 * @function
 * @name Controller:Paypal-Chained.abortPayment
 * @param {string} paymentID
 * @param {object} data
 * @param {interface} reply - hapi reply interface
 * @description - This do abort the payment
 * @return {object} - success
 */
var abortPayment = function (paymentId, data, reply) {
    console.error('Payment: ' + paymentId + ' aborted ');
    console.error(JSON.stringify(data, null, 2));
    Payment.abort(paymentId, data);

    return reply(Hapi.error.badRequest(JSON.stringify(data)));
};

/**
 * @function
 * @name Controller:Paypal-Chained.notifyPayPalError
 * @param {string} paymentID
 * @description - This do abort the payment
 * @return {object} - success
 */
var notifyPayPalError = function (paymentId) {
    // make sure all relevant paypal data made it to the db before
    // the notification is sent
    Q.delay(1000).then(function () {
        unagi.fire('payment:paypal:error', {
            paymentId: paymentId
        });
    });
};

/**
 * @function
 * @name Controller:Paypal-Chained.callbackHost
 * @param {object}  Payment
 * @functiondesc It gets custom callback URL user's payment {object}
 * then checks facebook-artist and facebook-arena URLs
 * @return {string} site URL
 */
function callbackHost(payment) {
    var customCallbackUrl = payment.userdata.customCallbackUrl;
    if (customCallbackUrl == 'facebook-artist') {
        return config.facebook.artistUrl;
    }
    if (customCallbackUrl == 'facebook-arena') {
        return config.facebook.arenaUrl;
    }

    return config.frontendUrl;
}

/**
 * @function
 * @name Controller:Paypal-Chained.initFlowData
 * @param {object}  Payment
 * @functiondesc It populates the request object for Payment with all parameters
 * @return {object} payment rquest
 */
var initFlowData = function (payment) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        actionType: 'PAY',
        currencyCode: currencyName(payment.currency),
        feesPayer: 'SECONDARYONLY',
        memo: 'GlobalRockstar',
        reverseAllParallelPaymentsOnError: true,
        cancelUrl: callbackHost(payment) + '/payments/' + payment._id.toString() + '/abort',
        returnUrl: callbackHost(payment) + '/payments/' + payment._id.toString() + '/paypal-success',
        ipnNotificationUrl: config.payPal.ipnNotificationUrl,
        trackingId: payment._id.toString(),
        receiverList: {
            receiver: [{
                email: payment.target.artist.paypal_email,
                amount: payment.amount,
                primary: 'true',
                paymentType: 'DIGITALGOODS'
            }, {
                email: payment.payPalAccount.grPayPalEmail,
                amount: payment.shares.gr,
                primary: 'false',
                paymentType: 'DIGITALGOODS'
            }]
        }
    };
};

/**
 * @function
 * @name Controller:Paypal-Chained.getSetDetailsData
 * @param {object}  Payment
 * @param {string} payment unique key
 * @functiondesc It populates the payment object with all unique payment key
 * @return {object} payment rquest
 */
var getSetDetailsData = function (payment, payKey) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        payKey: payKey,
        displayOptions: {
            businessName: 'GlobalRockstar'
        },
        receiverOptions: [{
            receiver: {
                email: payment.target.artist.paypal_email
            },
            invoiceData: {
                item: [{
                    name: payment.userdata.itemName,
                    price: '' + payment.amount.toFixed(2),
                    itemCount: '1',
                    itemPrice: '' + payment.amount.toFixed(2)
                }]
            }
        }]
    };
};

/**
 * @function
 * @name Controller:Paypal-Chained.getDetailsData
 * @param {object}  Payment
 * @functiondesc It populates the payment object with all unique payment key
 * @return {object} properties
 */
var getDetailsData = function (payment) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        trackingId: payment._id.toString()

    };
};

/**
 * @function
 * @name Controller:Paypal-Chained.createPayment
 * @param {object}  Payment
 * @functiondesc It populates the payment object with all unique payment key
 * @return {object} properties
 */
var createPayment = function (req, reply, payment) {
    var payload = initFlowData(payment);

    console.log('Create Payment => ');
    console.log(JSON.stringify(payload, null, 2));

    Payment.pushFlowData(payment._id, {
        sendToPayPal: payload
    });

    getSDK(payment).pay(payload, function (err, response) {
        if (err) {
            console.log('PayPal Pay Error =>');
            console.log(JSON.stringify(err, null, 2));
            console.log(JSON.stringify(response, null, 2));
            notifyPayPalError(payment._id);
            return abortPayment(payment._id, {
                error: err,
                response: response
            }, reply);
        }

        Payment.pushFlowData(payment._id, {
            receivedFromPayPal: response
        });
        console.log('PayPal Response =>');
        console.dir(response);

        var options = getSetDetailsData(payment, response.payKey);
        var returnValue = {
            paymentUrl: config.payPal.chained.paymentUrl,
            payKey: response.payKey
        };

        Payment.pushFlowData(payment._id, {
            sendToPayPal: options
        });

        getSDK(payment).setPaymentOptions(options, function (err, response) {
            if (err) {
                console.log('PayPal setPaymentOptions Error =>');
                console.log(JSON.stringify(err, null, 2));
                console.log(JSON.stringify(response, null, 2));
                notifyPayPalError(payment._id);
                return abortPayment(payment._id, {
                    error: err,
                    response: response
                }, reply);
            }

            Payment.pushFlowData(payment._id, {
                receivedFromPayPal: response
            });
            console.log('PayPal Response =>');
            console.dir(response);

            reply(returnValue);
        });
    });

};

/**
 * @function
 * @name Controller:Paypal-Chained.initChainedPayPalFlow
 * @param {object}  req - Request object
 * @param {interface}  reply - hapi reply interface
 * @param {object}  payment - Payment object
 * @functiondesc It checks artists payment is verified and paypal email
 * then create the payment, OR add the collective address to Payment model
 */
var initChainedPayPalFlow = function (req, reply, payment) {
    if (payment.target.artist.paypal_verified && payment.target.artist.paypal_email) {
        createPayment(req, reply, payment);
    } else {
        Payment.setUsedGRCollectiveAddress(payment._id, true)
            .then(function (pmt) {
                createPayment(req, reply, pmt);
            }).fail(function (err) {
                console.log(JSON.stringify(err, null, 2));
                notifyPayPalError(payment._id);
                abortPayment(payment._id, err, reply);
            });
    }
};

/**
 * @function
 * @name Controller:Paypal-Chained.finishChainedPayPalFlow
 * @param {object}  req - Request object
 * @param {interface}  reply - hapi reply interface
 * @param {object}  payment - Payment object
 * @functiondesc It loads the payments detail and set the payment flow date to Payment model
 * then call the adapptive payment method
 */
var finishChainedPayPalFlow = function (req, reply, payment) {
    console.log('finishChainedPayPalFlow =>');

    var payload = getDetailsData(payment);
    //console.log('Pushing FlowData to: ' + payment._id + ' => ');
    //console.log(JSON.stringify(payload, null, 2));
    Payment.pushFlowData(payment._id, {
        sendToPayPal: payload
    });

    getSDK(payment).callApi('AdaptivePayments/PaymentDetails', payload, function (err, response) {
        if (err) {
            console.log('PayPal Error =>');
            console.log(JSON.stringify(err, null, 2));
            console.log(JSON.stringify(response, null, 2));
            notifyPayPalError(payment._id);
            return abortPayment(payment._id, {
                error: err,
                response: response
            }, reply);
        }
        console.log('PayPal Response =>');
        console.dir(response);

        //console.log('Pushing FlowData to: ' + payment._id + ' => ');
        //console.log(JSON.stringify(response, null, 2));
        Payment.pushFlowData(payment._id, {
            receivedFromPayPal: response
        });

        if (response.status === 'COMPLETED') {
            Payment.commit(payment._id)
                .then(function (pmt) {
                    return reply(pmt).code(200);
                })
                .fail(function (err) {
                    return abortPayment(payment._id, err, reply);
                });
        } else {
            notifyPayPalError(payment._id);
            return abortPayment(payment._id, {
                receivedFromPayPal: response
            }, reply);
        }
    });
};

module.exports = {
    init: initChainedPayPalFlow,
    finish: finishChainedPayPalFlow
};
