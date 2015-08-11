/* globals describe, it, before, after, beforeEach, afterEach */
/* jshint -W030 */

'use strict';
var config = require('../../config');
var models = require('../../models');
var should = require('should');
var Q = require('q');
var dbUtil = require('../util/db');
var projectUtil = require('../util/project');
var artistUtil = require('../util/artist');
var fanUtil = require('../util/fan');
var voteUtil = require('../util/vote');
var voucherUtil = require('../util/voucher');
var mongoose = require('mongoose');
var Payment = mongoose.model('Payment');
var Project = mongoose.model('Project');
var Artist = mongoose.model('Artist');
var Fan = mongoose.model('Fan');
var Song = mongoose.model('Song');
var chai = require('chai');
chai.use(require('chai-datetime'));
var expect = chai.expect;
var _ = require('lodash');
var eventSpy = require('../util/eventSpy');

var objectId = mongoose.Types.ObjectId;

describe('Payment Model', function () {
    before(function (done) {
        dbUtil.resetDB().then(function () {
            done();
        });
    });

    afterEach(function (done) {
        dbUtil.resetDB().then(function () {
            done();
        });
    });

    describe('API', function () {
        var paymentId;
        var createdProject;
        var publishPendingProject;
        var expiredProject;
        var completedProject;

        var euroProject;
        var dollarProject;
        var euroFan;
        var dollarFan;
        var euroVote;
        var dollarVote;
        var euroArtist;
        var dollarArtist;
        var voucher;
        beforeEach(function (done) {
            Q.all([
                projectUtil.savedProject(),
                projectUtil.savedProject(),
                projectUtil.savedProject(),
                projectUtil.savedProject(),
                projectUtil.savedProject(),
                projectUtil.savedProject(),
                fanUtil.savedFan(),
                fanUtil.savedFan(),
                voteUtil.savedVote(),
                voteUtil.savedVote(),
                artistUtil.savedArtist(),
                artistUtil.savedArtist(),
            ]).spread(function (_createdProject, _publishPendingProject, _expiredProject, _completedProject, _euroProject, _dollarProject, _euroFan, _dollarFan, _euroVote, _dollarVote, _euroArtist, _dollarArtist) {

                var today = new Date();
                var inTwoWeeks = new Date();
                inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

                var beforeTwoWeeks = new Date();
                beforeTwoWeeks.setDate(beforeTwoWeeks.getDate() - 14);

                createdProject = _createdProject;
                createdProject.state = 'created';
                createdProject.releaseDate = inTwoWeeks;
                createdProject.artist = _euroArtist._id;

                publishPendingProject = _publishPendingProject;
                publishPendingProject.releaseDate = inTwoWeeks;
                publishPendingProject.state = 'publish-pending';
                publishPendingProject.artist = _euroArtist._id;

                expiredProject = _expiredProject;
                expiredProject.state = 'published';
                expiredProject.releaseDate = beforeTwoWeeks;
                expiredProject.artist = _euroArtist._id;

                completedProject = _completedProject;
                completedProject.releaseDate = inTwoWeeks;
                completedProject.state = 'completed';
                completedProject.artist = _euroArtist._id;

                euroArtist = _euroArtist;
                euroArtist.currency = 'EUR';
                euroArtist.paypal_email = 'artist@mail.com';
                euroArtist.paypal_verified = true;
                euroArtist.paypal_currency = 'EUR';

                dollarArtist = _dollarArtist;
                dollarArtist.currency = 'USD';
                dollarArtist.paypal_email = 'dollarArtist@mail.com';
                dollarArtist.paypal_currency = 'USD';
                dollarArtist.paypal_verified = true;

                euroProject = _euroProject;
                euroProject.currency = 'EUR';
                euroProject.state = 'published';
                euroProject.artist = euroArtist._id;

                dollarProject = _dollarProject;
                dollarProject.state = 'published';
                dollarProject.currency = 'USD';
                dollarProject.artist = dollarArtist._id;

                euroFan = _euroFan;
                euroFan.currency = 'EUR';

                dollarFan = _dollarFan;
                dollarFan.currency = 'USD';

                euroVote = _euroVote;
                euroVote.platform = 'ios';
                euroVote.artist = euroArtist._id;

                dollarVote = _dollarVote;
                dollarVote.platform = 'android';
                dollarVote.artist = euroArtist._id;

                return Q.all([
                    voucherUtil.savedVoucher(euroFan._id, 'fan'),

                    Q.ninvoke(createdProject, 'save'),
                    Q.ninvoke(publishPendingProject, 'save'),
                    Q.ninvoke(expiredProject, 'save'),
                    Q.ninvoke(completedProject, 'save'),

                    Q.ninvoke(euroProject, 'save'),
                    Q.ninvoke(dollarProject, 'save'),

                    Q.ninvoke(euroArtist, 'save'),
                    Q.ninvoke(dollarArtist, 'save'),

                    Q.ninvoke(euroFan, 'save'),
                    Q.ninvoke(dollarFan, 'save'),

                    Q.ninvoke(euroVote, 'save'),
                    Q.ninvoke(dollarVote, 'save'),
                ]);
            })
                .spread(function (_voucher) {
                    voucher = _voucher;
                    done();
                }).fail(function (error) {
                    console.dir(error);
                    done(error);
                });

        });

        describe('Transfer Payments ', function () {
            var firstPayOutDate = new Date();
            firstPayOutDate.setDate(firstPayOutDate.getDate() - (config.payment.transferMobilePaymentMinimumAge + 1));

            var lastPayOutDate = new Date();
            lastPayOutDate.setDate(lastPayOutDate.getDate() - (config.payment.transferMobilePaymentMaximumAge + 1));

            it('Payment.listPossibleMobilePaymentTransfers("aristId") returns list of untransfered payments and the aggregated amount', function (done) {
                Payment.createFromMobileVote(euroVote._id)
                    .then(function (pmt) {
                        pmt.completed = firstPayOutDate;
                        return Q.ninvoke(pmt, 'save');
                    })
                    .then(function (pmt) {
                        return Payment.createFromMobileVote(euroVote._id);
                    })
                    .then(function (pmt) {
                        pmt.completed = firstPayOutDate;
                        return Q.ninvoke(pmt, 'save');
                    })
                    .then(function () {
                        return Payment.createFromMobileVote(dollarVote._id);
                    })
                    .then(function (pmt) {
                        pmt.completed = firstPayOutDate;
                        return Q.ninvoke(pmt, 'save');
                    })
                    .then(function () {
                        return Payment.createFromMobileVote(euroVote._id);
                    })
                    .then(function (pmt) {
                        pmt.completed = lastPayOutDate;
                        return Q.ninvoke(pmt, 'save');
                    })
                    .then(function () {
                        return Payment.listPossibleMobilePaymentTransfers(euroArtist._id);
                    })
                    .then(function (pd) {
                        //console.log(JSON.stringify(pd, null, 2));
                        expect(pd.list.length).to.equal(3);
                        expect(pd.balance).to.equal(config.payment.paidVotePrice.EUR.artist * pd.list.length);
                        done();
                    })
                    .fail(function (err) {
                        done(err);
                    });
            });

            it('Payment.createMobileVoteTransferPayment("artistId") creates a valid payment object', function (done) {
                var firstPayOutDate = new Date();
                firstPayOutDate.setDate(firstPayOutDate.getDate() - (config.payment.transferMobilePaymentMinimumAge + 1));

                var lastPayOutDate = new Date();
                lastPayOutDate.setDate(lastPayOutDate.getDate() - (config.payment.transferMobilePaymentMaximumAge + 1));
                Q.all([
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                ])
                    .then(function (ps) {
                        ps[0].completed = firstPayOutDate;
                        ps[2].completed = firstPayOutDate;
                        ps[3].completed = firstPayOutDate;
                        ps[5].completed = firstPayOutDate;
                        ps[6].completed = firstPayOutDate;
                        ps[7].completed = lastPayOutDate;
                        ps[8].completed = firstPayOutDate;

                        euroArtist.paypal_currency = 'NZD';
                        return Q.all([
                            Q.ninvoke(ps[0], 'save'),
                            Q.ninvoke(ps[2], 'save'),
                            Q.ninvoke(ps[3], 'save'),
                            Q.ninvoke(ps[5], 'save'),
                            Q.ninvoke(ps[6], 'save'),
                            Q.ninvoke(ps[7], 'save'),
                            Q.ninvoke(ps[8], 'save'),
                            Q.ninvoke(euroArtist, 'save'),
                        ]);
                    })
                    .then(function () {
                        return Payment.createMobileVoteTransferPayment(euroArtist._id);
                    })
                    .then(function (pmt) {
                        var expectedAmount = Math.round((config.payment.paidVotePrice.NZD.artist * 6)*100)/100;
                        expect(pmt).to.exist;
                        //console.log(JSON.stringify(pmt, null, 2));
                        expect(pmt.currency).to.equal('NZD');
                        expect(pmt.amount).to.equal(expectedAmount);
                        expect(pmt.shares.artist).to.equal(expectedAmount);
                        expect(pmt.userdata.affectedPayments.length).to.equal(6);
                        expect(pmt.source.type).to.equal('Trustee');
                        expect(pmt.target.type).to.equal('Artist');
                        expect(pmt.target.artist.toString()).to.equal(euroArtist._id.toString());
                        expect(pmt.paymentType).to.equal('preapproved');
                        expect(pmt.state).to.equal('created');
                        expect(pmt.transfered).to.be.true;

                        var chkAffectedPayment = _.map(pmt.userdata.affectedPayments, function (pmtId) {
                            var dfd = Q.defer();
                            Q.ninvoke(Payment.findOne({
                                _id: pmtId
                            }), 'exec')
                                .then(function (ap) {
                                    if (ap.transferPayment && ap.transferPayment.toString() === pmt._id.toString()) {
                                        dfd.resolve();
                                    } else {
                                        dfd.reject(new Error('Transfer Payment not set'));
                                    }
                                });
                            return dfd.promise;
                        });

                        return Q.all(chkAffectedPayment);
                    })
                    .then(function () {
                        done();
                    })
                    .fail(function (err) {
                        done(err);
                    });
            });

            it('Commit of TransferPayment updates all affected payments', function (done) {
                var payment;
                var firstPayOutDate = new Date();
                firstPayOutDate.setDate(firstPayOutDate.getDate() - (config.payment.transferMobilePaymentMinimumAge + 1));

                Q.all([
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                    Payment.createFromMobileVote(dollarVote._id),
                ])
                    .then(function (ps) {
                        ps[0].completed = firstPayOutDate;
                        ps[2].completed = firstPayOutDate;
                        ps[3].completed = firstPayOutDate;
                        ps[5].completed = firstPayOutDate;
                        ps[6].completed = firstPayOutDate;
                        ps[8].completed = firstPayOutDate;

                        return Q.all([
                            Q.ninvoke(ps[0], 'save'),
                            Q.ninvoke(ps[2], 'save'),
                            Q.ninvoke(ps[3], 'save'),
                            Q.ninvoke(ps[5], 'save'),
                            Q.ninvoke(ps[6], 'save'),
                            Q.ninvoke(ps[8], 'save'),
                        ]);
                    })
                    .then(function () {
                        return Payment.createMobileVoteTransferPayment(euroArtist._id);
                    })
                    .then(function (pmt) {
                        payment = pmt;
                        return Payment.commit(pmt._id);
                    })
                    .then(function (_pmt) {
                        var pmt = _pmt;
                        expect(pmt.state).to.equal('completed');
                        //console.log(JSON.stringify(pmt, null, 2));
                        var chkAffectedPayment = _.map(pmt.userdata.affectedPayments, function (pmtId) {
                            var dfd = Q.defer();
                            Q.ninvoke(Payment.findOne({
                                _id: pmtId
                            }), 'exec')
                                .then(function (ap) {
                                    if (ap.transferPayment && ap.transferPayment.toString() === pmt._id.toString() && ap.transfered === true) {
                                        dfd.resolve();
                                    } else {
                                        dfd.reject(new Error('"transferPayment" or "transfered" flag not set correctly'));
                                    }
                                });
                            return dfd.promise;
                        });

                        return Q.all(chkAffectedPayment);
                    })
                    .then(function () {
                        done();
                    })
                    .fail(function (err) {
                        done(err);
                    });
            });

            it('Abort of TransferPayment resets all affected payments', function (done) {
                var payment;
                var firstPayOutDate = new Date();
                firstPayOutDate.setDate(firstPayOutDate.getDate() - (config.payment.transferMobilePaymentMinimumAge + 1));
                var affectedPayments;
                Q.all([
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                    Payment.createFromMobileVote(euroVote._id),
                ])
                    .then(function (ps) {
                        ps[0].completed = firstPayOutDate;
                        ps[2].completed = firstPayOutDate;
                        ps[3].completed = firstPayOutDate;
                        ps[5].completed = firstPayOutDate;
                        ps[6].completed = firstPayOutDate;
                        ps[8].completed = firstPayOutDate;

                        return Q.all([
                            Q.ninvoke(ps[0], 'save'),
                            Q.ninvoke(ps[2], 'save'),
                            Q.ninvoke(ps[3], 'save'),
                            Q.ninvoke(ps[5], 'save'),
                            Q.ninvoke(ps[6], 'save'),
                            Q.ninvoke(ps[8], 'save'),
                        ]);
                    })
                    .then(function () {
                        return Payment.createMobileVoteTransferPayment(euroArtist._id);
                    })
                    .then(function (pmt) {
                        affectedPayments = pmt.userdata.affectedPayments;
                        return Payment.abort(pmt._id);
                    })
                    .then(function (pmt) {
                        return Q.ninvoke(Payment.find({
                            _id: {
                                $in: affectedPayments
                            }
                        }), 'exec');
                    })
                    .then(function (affected) {
                        //console.log(JSON.stringify(affected, null, 2));
                        _.each(affected, function (a) {
                            expect(a.transferPayment).not.to.exist;
                        });
                        done();
                    })
                    .fail(function (err) {
                        done(err);
                    });
            });
        });
    });
});
