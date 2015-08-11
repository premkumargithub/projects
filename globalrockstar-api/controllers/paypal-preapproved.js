'use strict';
/**
 *@module Controller:Paypal-Preapproved
 *@description decision maker for paypal preapproved activities
 *Required module define here
 *@requires lodash
 *@requires hapi
 *@requires ../config
 *@requires request
 *@requires q
 *@requires ../models/payment
 *@requires paypal-adaptive
 *@requires node-redis-pubsub
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
 * @function
 * @name Controller:Paypal-Preapproved.currencyName
 * @param {string} - Currency
 * @description It checks type(currency)
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
 * @name Controller:Paypal-Preapproved.getSDK
 * @param {object}  Payment -gt
 * @description It instantiate the Paypal SDK class object
 * @return {object}
 */
function getSDK(pmt) {
    return new PayPal(pmt.payPalAccount);
}

/**
 * @function
 * @name Controller:Paypal-Preapproved.notifyPayPalError
 * @param {ObjectId} paymentID payment ID
 * @description  This do abort the payment
 * @return {object} success
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
 * @name Controller:Paypal-Preapproved.abortPayment
 * @param {ObjectId} paymentID payment ID
 * @param {object} data data
 * @param {interface} reply  hapi reply interface
 * @description This do abort the payment
 * @return {object} success
 */
var abortPayment = function (paymentId, data, reply) {
    console.error('Payment: ' + paymentId + ' aborted ');
    console.error(JSON.stringify(data, null, 2));
    Payment.abort(paymentId, data);
    return reply(Hapi.error.badRequest(JSON.stringify(data)));
};

/**
 * @function
 * @name Controller:Paypal-Preapproved.initFlowData
 * @param {object} payment payment data
 * @description This do abort the payment
 * @return {object} success
 */
var initFlowData = function (payment) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        actionType: 'CREATE',
        currencyCode: currencyName(payment.currency),
        feesPayer: 'SENDER',
        cancelUrl: config.frontendUrl + '/payments/' + payment._id.toString() + '/abort',
        returnUrl: config.frontendUrl + '/payments/' + payment._id.toString() + '/paypal-success',
        trackingId: payment._id.toString(),
        senderEmail: payment.payPalAccount.grPayPalEmail,
        receiverList: {
            receiver: [{
                email: payment.target.artist.paypal_email,
                amount: payment.shares.artist
            }]
        }
    };
};

/**
 * @function
 * @name Controller:Paypal-Preapproved.getDetailsData
 * @param {object} payment payment data
 * @description Used to get the payment datail object
 * @return {object}
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
 * @name Controller:Paypal-Preapproved.getSetDetailsData
 * @param {object} payment payment data
 * @param {String} payKey - payment key
 * @description Used to set the payment datails to the property
 * @return {object}
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
                    name: payment.userdata.itemName ? payment.userdata.itemName : 'Mobile vote transfer payment',
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
 * @name Controller:Paypal-Preapproved.getExecuteData
 * @param {String} payKey - payment key
 * @description Used to used get he payment executed data from the payment flow
 * @return {object}
 */
var getExecuteData = function (payKey) {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        payKey: payKey
    };
};

/**
 * @function
 * @name Controller:Paypal-Preapproved.finishPreapprovedPayPalFlow
 * @param {object} req - Request object
 * @param {interface} reply - hapi reply interface
 * @param {object} payment - payment object
 * @description Used to finishing the preapproved paypal payment flow
 * @return {object}
 */
var finishPreapprovedPayPalFlow = function (req, reply, payment) {
    console.log('finishPreapprovedPayPalFlow =>');

    var payload = getDetailsData(payment);
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

        Payment.pushFlowData(payment._id, {
            receivedFromPayPal: response
        });

        if (response.status === 'COMPLETED') {
            Payment.commit(payment._id)
                .then(function (pmt) {
                    return reply(payment).code(200);
                })
                .fail(function (err) {
                    return abortPayment(payment._id, err, reply);
                });
        } else {
            return abortPayment(payment._id, {
                receivedFromPayPal: response
            }, reply);
        }
    });
};

/**
 * @function
 * @name Controller:Paypal-Preapproved.createPayment
 * @param {object} req - Request object
 * @param {interface} reply - hapi reply interface
 * @param {object} payment - payment object
 * @description Used to creating the payment and save the details in the Payment model
 * @return {object}
 */
var createPayment = function (req, reply, payment) {
    var payload = initFlowData(payment);

    console.log("PREAPPROVED PAYMENT =>");
    console.log(JSON.stringify(payment, null, 2));
    console.log("END PREAPPROVED PAYMENT");

    Payment.pushFlowData(payment._id, {
        sendToPayPal: payload
    });

    getSDK(payment).pay(payload, function (err, response) {
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

        Payment.pushFlowData(payment._id, {
            receivedFromPayPal: response
        });
        console.log('PayPal Create Payment Response =>');
        console.dir(response);

        var options = getSetDetailsData(payment, response.payKey);
        var payKey = response.payKey;
        if (response.paymentExecStatus !== 'CREATED') {
            return abortPayment(payment._id, response, reply);
        }

        Payment.pushFlowData(payment._id, {
            sendToPayPal: options
        });

        getSDK(payment).setPaymentOptions(options, function (err, optResponse) {
            if (err) {
                console.log('PayPal setPaymentOptions Error =>');
                console.log(JSON.stringify(err, null, 2));
                console.log(JSON.stringify(optResponse, null, 2));
                notifyPayPalError(payment._id);
                return abortPayment(payment._id, {
                    error: err,
                    response: optResponse
                }, reply);
            }

            Payment.pushFlowData(payment._id, {
                receivedFromPayPal: optResponse
            });
            console.log('PayPal set Details Response =>');
            console.dir(optResponse);

            var executeData = getExecuteData(payKey);
            Payment.pushFlowData(payment._id, {
                sendToPayPal: executeData
            });

            getSDK(payment).callApi('AdaptivePayments/ExecutePayment', executeData, function (err, execResponse) {
                if (err) {
                    console.log('PayPal Error =>');
                    console.log(JSON.stringify(err, null, 2));
                    console.log(JSON.stringify(execResponse, null, 2));
                    notifyPayPalError(payment._id);
                    return abortPayment(payment._id, {
                        error: err,
                        response: execResponse
                    }, reply);
                }
                console.log('PayPal execute Response =>');
                console.dir(execResponse);

                if (execResponse.paymentExecStatus !== 'COMPLETED') {
                    return abortPayment(payment._id, execResponse, reply);
                }
                Payment.pushFlowData(payment._id, {
                    receivedFromPayPal: execResponse
                });

                finishPreapprovedPayPalFlow(req, reply, payment);
            });
        });
    });
};

/**
 * @function
 * @name Controller:Paypal-Preapproved.initPreapprovedPayPalFlow
 * @param {object} req - Request object
 * @param {interface} reply - hapi reply interface
 * @param {object} payment - payment object
 * @description Used to pre populate the payment object
 * @return {object}
 */
var initPreapprovedPayPalFlow = function (req, reply, payment) {
    if (payment.target.artist.paypal_verified && payment.target.artist.paypal_email) {
        createPayment(req, reply, payment);
    } else {
        abortPayment(payment._id, new Error('Artst not paypal_verified or paypal_email missing'), reply);
    }
};

module.exports = {
    init: initPreapprovedPayPalFlow
};
