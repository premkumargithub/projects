'use strict';

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    mongoose = require('mongoose'),
    Q = require('q'),
    _ = require('lodash'),
    Hapi = require('hapi');
var ArtistPaypalCheckModel = require('./models/artist-paypal-check');

//console.log(config);

var Artist = mongoose.model('Artist');
var ArtistPaypalCheck = mongoose.model('ArtistPaypalCheck');

var ppController = require('../controllers/paypal');

var updated = 0;

var artists = [];

function sequentialCheck() {
    var a = artists.pop();
    if (!a) {
        console.log("Checked " + updated + " accounts.");
        console.log("Finished!");
        process.exit(0);
    }
    checkWith(a);
}

function checkWith(a) {
    var dfd = Q.defer();

    var logMessage = 'ARTIST name: ' + a.name + ' email: ' + a.email + ' firstname: ' + a.firstname + ' lastname: ' + a.lastname + ' usedContactData: ' + a.usedContactData + ' usedContactEmail: ' + a.usedContactEmail + '\n';
    var checkResult = new ArtistPaypalCheck(a);

    ppController.checkAccountExists(a.email, a.firstname, a.lastname)
        .then(function (msg) {
            logMessage += msg + '\n';

            checkResult.verified = true;

            return Q.allSettled([
                ppController.checkAcceptsCurrency(a.email, 'USD'),
                ppController.checkAcceptsCurrency(a.email, 'EUR')
            ]);
        })
        .spread(function (dollarRes, euroRes) {
            if (dollarRes.state === 'fulfilled') {
                checkResult.currencies.push('USD');
                logMessage += dollarRes.value + '\n';
            } else {
                logMessage += dollarRes.reason + '\n';
            }

            if (euroRes.state === 'fulfilled') {
                checkResult.currencies.push('EUR');
                logMessage += euroRes.value + '\n';
            } else {
                logMessage += euroRes.reason + '\n';
            }

            Q.ninvoke(checkResult, 'save').
            then(function () {
                console.log(logMessage);
                updated++;
                sequentialCheck();
                dfd.resolve();
            });

        })
        .fail(function (msg) {
            logMessage += msg + '\n';

            Q.ninvoke(checkResult, 'save').
            then(function () {
                console.log(logMessage);
                updated++;
                sequentialCheck();
                dfd.resolve();
            });
        });

    return dfd.promise;
}

var query = {
    paypal_verified: false
};

Q.ninvoke(Artist.find(query)
        //.limit(10)
        .select('name paypal_email paypal_firstname paypal_lastname paypal_verifiedi paypal_currency email contact.first_name contact.last_name'), 'exec')
    .then(function (_artists) {
        _.each(_artists, function (a) {

            if (a.paypal_email && a.paypal_lastname && a.paypal_firstname) {
                artists.push({
                    artistId: a._id,
                    name: a.name,
                    email: a.paypal_email,
                    firstname: a.paypal_firstname,
                    lastname: a.paypal_lastname,
                    usedContactEmail: false,
                    usedContactData: false
                });
            } else if (a.paypbl_email && a.contact.first_name && a.contact.last_name) {
                artists.push({
                    artistId: a._id,
                    name: a.name,
                    email: a.paypal_email,
                    firstname: a.contact.first_name,
                    lastname: a.contact.last_name,
                    usedContactEmail: false,
                    usedContactData: true
                });
            } else if (a.email && a.contact.first_name && a.contact.last_name) {
                artists.push({
                    artistId: a._id,
                    name: a.name,
                    email: a.email,
                    firstname: a.contact.first_name,
                    lastname: a.contact.last_name,
                    usedContactEmail: true,
                    usedContactData: true
                });
            }

        });

        // console.log(JSON.stringify(artists, null, 2));

        console.log("Will check: " + artists.length + " accounts.");
        sequentialCheck();
    });
