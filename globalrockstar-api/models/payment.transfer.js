'use strict';

var Q = require('q');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamps');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('lodash');
var nrp = require('node-redis-pubsub');
var config = require('../config');
var unagi = new nrp(config.redis);
var currencies = require('../public/configs/currencies');

var twoCommas = function (float) {
    return parseFloat(float).toFixed(2);
};

function getTransferableMobilePaymentMaxDate() {
    var now = new Date();
    now.setDate(now.getDate() - config.payment.transferMobilePaymentMinimumAge);
    return now;
}

function getTransferableMobilePaymentMinDate() {
    var now = new Date();
    now.setDate(now.getDate() - config.payment.transferMobilePaymentMaximumAge);
    return now;
}
module.exports = function (schema) {

    function commitListener(payment) {
        if (payment.target.type !== 'Artist' || payment.source.type !== 'Trustee') {
            return new Q();
        }
        var dfd = Q.defer();

        var model = mongoose.model('Payment');
        Q.ninvoke(model.find({
            transferPayment: payment._id
        }), 'exec')
            .then(function (affectedPayments) {
                //                dfd.resolve();

                var setTransfered = _.map(affectedPayments, function (ap) {
                    return model.setTransfered(ap._id, payment._id);
                });

                return Q.all(setTransfered);
            })
            .then(function () {
                unagi.fire('transfer:completed', {
                    transfer: payment
                });
                dfd.resolve();
            })
            .fail(function (err) {
                console.error('Error occured in TransferPaymentCommitListener =>');
                console.dir(err);
                dfd.reject(err);
            });

        return dfd.promise;
    }

    schema.statics.commitListeners.push({
        name: 'TransferCommitListener',
        handler: commitListener
    });

    function abortListener(payment) {
        if (payment.target.type !== 'Artist' || payment.source.type !== 'Trustee') {
            return new Q();
        }
        var dfd = Q.defer();
        var Payment = mongoose.model('Payment');
        console.log("Aborting Transfer Payment: " + payment._id);
        Q.ninvoke(Payment.update({
            _id: {
                $in: payment.userdata.affectedPayments
            }
        }, {
            $unset: {
                transferPayment: ''
            }
        }, {
            multi: true
        }), 'exec')
            .spread(function (numberAffected) {
                if (numberAffected !== payment.userdata.affectedPayments.length) {
                    console.error('Abort of Transfer Payment: ' + payment._id + ' incomplete!');
                }
                dfd.resolve(payment);
            })
            .fail(function (err) {
                console.error(err);
                dfd.reject(err);
            });
        return dfd.promise;
    }

    schema.statics.abortListeners.push({
        name: 'TransferAbortListener',
        handler: abortListener
    });

    // Setup indices
    schema.index({
        'transfered': 1,
        'transferPayment': 1
    });

    schema.statics.setTransferPayment = function (paymentId, transferPaymentId) {
        var dfd = Q.defer();
        Q.ninvoke(mongoose.model('Payment').findOneAndUpdate({
            $and: [{
                _id: paymentId
            }, {
                state: 'completed'
            }, {
                transfered: false
            }, {
                transferPayment: {
                    $exists: false
                }
            }]
        }, {
            transferPayment: transferPaymentId
        }), 'exec')
            .then(function (pmt) {
                if (!pmt) {
                    return dfd.reject('Payment: ' + paymentId + ' does not exist or in invalid state!');
                }
                dfd.resolve(pmt);
            })
            .fail(function (err) {
                dfd.reject(err);
                console.error(err);
            });

        return dfd.promise;
    };

    schema.statics.setTransfered = function (paymentId, transferPaymentId) {
        var dfd = Q.defer();
        Q.ninvoke(mongoose.model('Payment').findOneAndUpdate({
            $and: [{
                _id: paymentId
            }, {
                state: 'completed'
            }, {
                transfered: false
            }, {
                transferPayment: transferPaymentId
            }]
        }, {
            transfered: true
        }), 'exec')
            .then(function (pmt) {
                if (!pmt) {
                    return dfd.reject('Payment: ' + paymentId + ' does not exist or in invalid state!');
                }
                dfd.resolve(pmt);
            })
            .fail(function (err) {
                dfd.reject(err);
                console.error(err);
            });

        return dfd.promise;
    };

    function transferableMobileVotePaymentsQry(artistId) {
        return {
            $and: [{
                'target.artist': artistId
            }, {
                'state': 'completed'
            }, {
                'transfered': false
            }, {
                'paymentType': 'mobile'
            }, {
                'completed': {
                    '$lt': getTransferableMobilePaymentMaxDate()
                }
            }, {
                'completed': {
                    '$gte': getTransferableMobilePaymentMinDate()
                }
            }, {
                transferPayment: {
                    $exists: false
                }
            }, {
                'source.type': {
                    $ne: 'Trustee'
                }
            }]
        };
    }

    schema.statics.listPossibleMobilePaymentTransfers = function (artistId) {
        var Payment = mongoose.model('Payment');
        var findQ = transferableMobileVotePaymentsQry(artistId);
        var dfd = Q.defer();

        if (!artistId) {
            return dfd.reject('No artistId given!');
        }

        var sort = {
            createdAt: -1
        };

        var artistModel = mongoose.model('Artist');
        var paymentModel = mongoose.model('Payment');

        return Q.all([
            Q.ninvoke(artistModel.findOne({_id: artistId}), 'exec'),
            Q.ninvoke(paymentModel.find(findQ).sort(sort).select('-paymentFlow -userdata'), 'exec')

        ])
            .spread(function (artist, payments) {
                var ps = [];
                _.each(payments, function (p) {
                    var pPlain = p.toObject();
                    pPlain.transferState = Payment.getTransferState(p);
                    ps.push(pPlain);
                });

                var amount = Payment.validAmount(config.payment.paidVotePrice[artist.paypal_currency].artist, artist.paypal_currency) * ps.length;
                return {
                    list: ps,
                    balance: amount
                };
            })
            .fail(function (err) {
                console.error(err);
            });
    };

    schema.statics.createMobileVoteTransferPayment = function (artistId) {
        var dfd = Q.defer();
        var Payment = mongoose.model('Payment');

        if (!artistId) {
            return dfd.reject('No artistId given!');
        }

        var artistModel = mongoose.model('Artist');
        var paymentModel = mongoose.model('Payment');
        var payment = new this();

        Q.all([
            Q.ninvoke(artistModel.findOne({
                _id: artistId
            }), 'exec'),
            Payment.listPossibleMobilePaymentTransfers(artistId)
        ])
            .spread(function (artist, payments) {
                if (!payments.list.length) {
                    return dfd.reject(new Error('No payments found for transfer!'));
                }
                if (!artist) {
                    return dfd.reject(new Error('No aritist found by the given id: ' + artistId));
                }
                if (!artist.paypal_email || !artist.paypal_verified) {
                    return dfd.reject(new Error('Artist has no verified paypal address!'));
                }

                var affectedPayments = _.map(payments.list, function (pmt) {
                    return pmt._id;
                });

                var amount = payments.balance;

                console.log("Affected Payments: ");
                console.log(JSON.stringify(affectedPayments, null, 2));
                console.log("PAYMNET AMOUNT =>" + amount);

                payment.source.type = 'Trustee';
                payment.target.type = 'Artist';
                payment.target.artist = artistId;
                payment.amount = twoCommas(amount);
                payment.currency = artist.paypal_currency;
                payment.paymentType = 'preapproved';
                payment.transfered = true;
                payment.userdata = {
                    affectedPayments: affectedPayments,
                    redirectTo: '/account/payments/transfer'
                };

                payment.shares.artist = payment.amount;
                payment.shares.gr = -1;

                var setTranfserPaymentIds = _.map(affectedPayments, function (affectedPaymentId) {
                    return paymentModel.setTransferPayment(affectedPaymentId, payment._id);
                });

                return Q.all(setTranfserPaymentIds);
            })
            .then(function () {
                return Q.ninvoke(payment, 'save');
            })
            .then(function () {
                dfd.resolve(payment);
            })
            .fail(function (err) {
                console.error(err);
                dfd.reject(err);
            });

        return dfd.promise;
    };

    schema.statics.getTransferState = function (payment) {
        if (payment.paymentType != 'mobile' || payment.target.type !== 'Vote' || payment.transfered) {
            return 'transfered';
        }

        if (!payment.transferd && payment.state === 'completed' && new Date(payment.completed) < getTransferableMobilePaymentMaxDate() && new Date(payment.completed) >= getTransferableMobilePaymentMinDate()) {
            return 'transfer-pending';
        }

        if (!payment.transferd && payment.state === 'completed' && new Date(payment.completed) >= getTransferableMobilePaymentMaxDate()) {
            return 'transfer-pending-but-too-young';
        }

        if (!payment.transferd && payment.state === 'completed' && new Date(payment.completed) < getTransferableMobilePaymentMinDate()) {
            return 'transfer-pending-but-too-old';
        }

        return 'Invalid transferable payment state!';
    };
};
