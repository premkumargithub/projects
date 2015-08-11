'use strict';

var _ = require('lodash');
var Hapi = require('hapi');
var config = require('../config');
var request = require('request');
var Q = require('q');
var Payment = require('../models/payment');
var PayPal = require('paypal-adaptive');

function getSDK() {
    return new PayPal(config.payPal.defaultAccount);
}

function requestData() {
    return {
        requestEnvelope: {
            errorLanguage: 'en_US'
        },
        baseAmountList: {
            currency: [{
                code: 'EUR',
                amount: '1'
            }, {
                code: 'USD',
                amount: '1'
            }]
        },
        convertToCurrencyList: {
            currencyCode: [ 'EUR', 'USD' ]
        },
        countryCode: 'US'
    };
}

function goForIt() {

    var payload = requestData();
    getSDK().callApi('AdaptivePayments/ConvertCurrency', payload, function (err, response) {
        if (err) {
            console.error('PayPal Error =>');
            console.error(JSON.stringify(err, null, 2));
            console.error(JSON.stringify(response, null, 2));
            return;
        }
        console.log('PayPal Response =>');
        console.log(JSON.stringify(response, null, 2));

        process.exit();
    });
}

goForIt();
