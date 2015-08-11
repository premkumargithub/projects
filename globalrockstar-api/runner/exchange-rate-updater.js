'use strict';

var https = require('https');
var config = require("../config");
var models = require('../models');
var db = require('../lib/database');
var mongoose = require('mongoose');
var Q = require('q');
var _ = require('lodash');
var request = require('request');
var ExchangeRate = require('../models/exchange-rate');
var currencies = require('../public/configs/currencies.json');

function buildYahooFinaceQuery() {
    var qs = _.map(_.filter(currencies, function (c) {
        return c.code !== 'USD';
    }), function (c) {
        return '"USD' + c.code + '"';
    });

    var query = 'select * from yahoo.finance.xchange where pair in (' + qs.join() + ')';
    return 'https://query.yahooapis.com/v1/public/yql?q=' + query + '&format=json&env=store://datatables.org/alltableswithkeys';
}

function getExchangeRates() {
    var dfd = Q.defer();
    var url = buildYahooFinaceQuery();

    //console.log(url);

    Q.nfcall(request, url)
        .spread(function (response, body) {
            //console.log("Returned: " + body)

            var result = JSON.parse(body);
            var rates = {};
            _.each(result.query.results.rate, function (rate) {
                rates[rate.id.replace('USD', '')] = parseFloat(rate.Rate);
            });
            dfd.resolve(rates);
        })
        .fail(function (err) {
            console.error(err);
            dfd.reject(err);
        });

    return dfd.promise;
}

function updateExchangeRates() {
    getExchangeRates().then(function (rates) {
        console.log('Updating Exchange Rates from Yahoo Finance API => ');
        console.log(JSON.stringify(rates, null, 2));
        var exrm = new ExchangeRate({
            source: 'Yahoo Finance API',
            rates: rates
        });
        return Q.ninvoke(exrm, 'save');
    });
}

module.exports = {
    getExchangeRates: getExchangeRates,
    updateExchangeRates: updateExchangeRates
};

updateExchangeRates();
