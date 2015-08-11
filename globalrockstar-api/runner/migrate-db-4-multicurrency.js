/* global db, ObjectId, ISODate */
// Run in mongo shell
'use strict';

// Renamve voucher template fields
db.vouchertemplates.update({
    "amount.dollar": {
        $exists: 1
    }
}, {
    $rename: {
        "amount.dollar": "amount.USD"
    }
}, {
    multi: true
});
db.vouchertemplates.update({
    "amount.euro": {
        $exists: 1
    }
}, {
    $rename: {
        "amount.euro": "amount.EUR"
    }
}, {
    multi: true
});

// Rename voucher fields
db.vouchers.update({
    "amount.dollar": {
        $exists: 1
    }
}, {
    $rename: {
        "amount.dollar": "amount.USD"
    }
}, {
    multi: true
});

db.vouchers.update({
    "amount.euro": {
        $exists: 1
    }
}, {
    $rename: {
        "amount.euro": "amount.EUR"
    }
}, {
    multi: true
});

// Setup excahnge rates
db.exchangerates.insert({
    "_id" : ObjectId("54364cafe6e50a0000cd1fc8"),
    "updatedAt" : ISODate("2014-10-09T08:51:59.922Z"),
    "createdAt" : ISODate("2014-10-09T08:51:59.922Z"),
    "source" : "Yahoo Finance API",
    "rates" : {
        "TRY" : 2.2624,
        "THB" : 32.42,
        "TWD" : 30.355,
        "CHF" : 0.949,
        "SEK" : 7.1452,
        "SGD" : 1.2697,
        "RUB" : 39.9085,
        "GBP" : 0.6175,
        "PLN" : 3.2758,
        "PHP" : 44.65,
        "NOK" : 6.4166,
        "NZD" : 1.2578,
        "MXN" : 13.3047,
        "MYR" : 3.2429,
        "JPY" : 107.845,
        "ILS" : 3.6913,
        "HUF" : 239.78,
        "HKD" : 7.7549,
        "EUR" : 0.7832,
        "DKK" : 5.8304,
        "CZK" : 21.555,
        "CAD" : 1.1098,
        "BRL" : 2.3779,
        "AUD" : 1.1268
    },
    "__v" : 0
});

var rates = {
        "TRY" : 2.2624,
        "THB" : 32.42,
        "TWD" : 30.355,
        "CHF" : 0.949,
        "SEK" : 7.1452,
        "SGD" : 1.2697,
        "RUB" : 39.9085,
        "GBP" : 0.6175,
        "PLN" : 3.2758,
        "PHP" : 44.65,
        "NOK" : 6.4166,
        "NZD" : 1.2578,
        "MXN" : 13.3047,
        "MYR" : 3.2429,
        "JPY" : 107.845,
        "ILS" : 3.6913,
        "HUF" : 239.78,
        "HKD" : 7.7549,
        "DKK" : 5.8304,
        "CZK" : 21.555,
        "CAD" : 1.1098,
        "BRL" : 2.3779,
        "AUD" : 1.1268
    };

db.vouchertemplates.find().forEach(function(doc) {
    var usdPrice = doc.amount.USD;
    for(var key in rates) {
        var price = Math.round(usdPrice * rates[key] * 100)/100;
        doc.amount[key] = price;
    }
    db.vouchertemplates.update( { _id: doc._id }, doc );
});
