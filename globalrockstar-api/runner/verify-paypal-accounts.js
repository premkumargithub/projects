'use strict';

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    mongoose = require('mongoose'),
    Q = require('q'),
    _ = require('lodash'),
    Hapi = require('hapi');

console.log(config);

var Artist = mongoose.model('Artist');
var ppController = require('../controllers/paypal');

var updated = 0;

var artists = [];

function sequentialCheck() {
    var a = artists.pop();
    if (!a) {
        console.log("Checked "  + updated + " accounts.");
        console.log("Finished!");
        process.exit(0);
    }
    verifyArtist(a);
}

function verifyArtist(artist) {
    var dfd = Q.defer();

    var logMessage = 'ARTIST name: ' + artist.name + ' email: ' + artist.paypal_email + ' firstname: ' + artist.paypal_firstname + ' lastname: ' + artist.paypal_lastname + '\n';
    ppController.checkAccountExists(artist.paypal_email, artist.paypal_firstname, artist.paypal_lastname)
        .then(function (msg) {
            logMessage += msg + '\n';

            return ppController.checkAcceptsCurrency(artist.paypal_email, 'EUR');
        })
        .then(function (msg) {
            logMessage += msg + '\n';
            return ppController.checkAcceptsCurrency(artist.paypal_email, 'USD');
        })
        .then(function (msg) {
            logMessage += msg + '\n';


            return Q.ninvoke(Artist.findOneAndUpdate({
                _id: artist._id
            }, {
                paypal_verified: true
            }), 'exec');
        })
        .then(function (updateed) {
            logMessage += "ENABLED " + artist.paypal_email + '\n';

            console.log(logMessage);
            //console.log("UPDATED " + artist.paypal_email + " " + artist.paypal_firstname + " " + artist.paypal_lastname);
            //console.log();
            updated++;
            sequentialCheck();
            dfd.resolve();
        })
        .fail(function (msg) {
            logMessage += msg + '\n';


            Q.ninvoke(Artist.findOneAndUpdate({
                _id: artist._id
            }, {
                paypal_verified: false
            }), 'exec')
                .then(function () {
                    logMessage += "DISABLED " + artist.paypal_email + '\n';
                    //console.log("UPDATED " + artist.paypal_email + " " + artist.paypal_firstname + " " + artist.paypal_lastname);
                    //console.log();
                    console.log(logMessage);
                    updated++;
                    sequentialCheck();
                    dfd.resolve();

                });
        });

    return dfd.promise;
}

var query = {
    $and: [{
        paypal_email: {
            $exists: true,
            $nin: ['']
        }
    }, {
        paypal_firstname: {
            $exists: true,
            $nin: ['']
        }
    }, {
        paypal_lastname: {
            $exists: true,
            $nin: ['']
        }
    }, ]
};


Q.ninvoke(Artist.count(query), 'exec')
    .then(function (count) {
        console.log("Checking : " + count + " Artists...");
        return Q.ninvoke(Artist.find(query).select('name paypal_email paypal_firstname paypal_lastname paypal_verified'), 'exec');
    })
    .then(function (_artists) {
        artists = _artists;
        sequentialCheck();
    })
    .fail(function (err) {
        console.error(err);
        process.exit(1);
    });
