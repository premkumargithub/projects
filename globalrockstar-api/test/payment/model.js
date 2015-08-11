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
                dollarVote.artist = dollarArtist._id;

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

        describe('Creating Payments', function () {
            describe('for Projects', function () {
                it('Cannot create Payment for "created" project', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Project', createdProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            done(new Error('this should have failed'));
                        })
                        .fail(function (err) {
                            done();
                        });
                });

                it('Cannot create Payment for "publish-pending" project', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Project', publishPendingProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            done(new Error('this should have failed'));
                        })
                        .fail(function (err) {
                            done();
                        });
                });

                it('Cannot create Payment for "expired" project', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Project', expiredProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            done(new Error('this should have failed'));
                        })
                        .fail(function (err) {
                            done();
                        });
                });

                it('Cannot create Payment for "completed" project', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Project', completedProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            done(new Error('this should have failed'));
                        })
                        .fail(function (err) {
                            done();
                        });
                });

                it('Creates expected € Fan -> € Project payment', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Project', euroProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');

                            payment.currency.should.equal('EUR');
                            payment.target.project.toString().should.equal(euroProject._id.toString());
                            payment.source.fan.toString().should.equal(euroFan._id.toString());
                            payment.paymentType.should.equal('chained');

                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected € Artist -> € Project payment', function (done) {
                    Payment.createPayment('Artist', euroArtist._id, 'Project', euroProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('EUR');
                            payment.target.project.toString().should.equal(euroProject._id.toString());
                            payment.source.artist.toString().should.equal(euroArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Fan -> € Project payment', function (done) {
                    Payment.createPayment('Fan', dollarFan._id, 'Project', euroProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');

                            payment.currency.should.equal('EUR');
                            payment.target.project.toString().should.equal(euroProject._id.toString());
                            payment.source.fan.toString().should.equal(dollarFan._id.toString());
                            payment.paymentType.should.equal('chained');

                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Artist -> € Project payment', function (done) {
                    Payment.createPayment('Artist', dollarArtist._id, 'Project', euroProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('EUR');
                            payment.target.project.toString().should.equal(euroProject._id.toString());
                            payment.source.artist.toString().should.equal(dollarArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Fan -> $ Project payment', function (done) {
                    Payment.createPayment('Fan', dollarFan._id, 'Project', dollarProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');

                            payment.currency.should.equal('USD');
                            payment.target.project.toString().should.equal(dollarProject._id.toString());
                            payment.source.fan.toString().should.equal(dollarFan._id.toString());
                            payment.paymentType.should.equal('chained');

                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Artist -> $ Project payment', function (done) {
                    Payment.createPayment('Artist', dollarArtist._id, 'Project', dollarProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('USD');
                            payment.target.project.toString().should.equal(dollarProject._id.toString());
                            payment.source.artist.toString().should.equal(dollarArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected € Fan -> $ Project payment', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Project', dollarProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');

                            payment.currency.should.equal('USD');
                            payment.target.project.toString().should.equal(dollarProject._id.toString());
                            payment.source.fan.toString().should.equal(euroFan._id.toString());
                            payment.paymentType.should.equal('chained');

                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected € Artist -> $ Project payment', function (done) {
                    Payment.createPayment('Artist', euroArtist._id, 'Project', dollarProject._id, 42, {}, 42, 1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('USD');
                            payment.target.project.toString().should.equal(dollarProject._id.toString());
                            payment.source.artist.toString().should.equal(euroArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.amount.should.equal(42);
                            payment.shares.gr.should.equal(parseFloat((42 * config.payment.projectFee).toFixed(2)));
                            payment.shares.artist.should.equal(parseFloat(42 - (42 * config.payment.projectFee).toFixed(2)));
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });
            });

            describe('for Votes', function () {
                it('Creates expected € Fan -> € Vote payment', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Vote', euroVote._id, 42)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('EUR');
                            payment.target.vote.toString().should.equal(euroVote._id.toString());
                            payment.source.fan.toString().should.equal(euroFan._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.EUR.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.EUR.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.EUR.gr + config.payment.paidVotePrice.EUR.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected € Artist -> € Vote payment', function (done) {
                    Payment.createPayment('Artist', euroArtist._id, 'Vote', euroVote._id, -1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            console.dir(config);
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('EUR');
                            payment.target.vote.toString().should.equal(euroVote._id.toString());
                            payment.source.artist.toString().should.equal(euroArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.EUR.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.EUR.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.EUR.gr + config.payment.paidVotePrice.EUR.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Fan -> $ Vote payment', function (done) {
                    Payment.createPayment('Fan', dollarFan._id, 'Vote', dollarVote._id, 42)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('USD');
                            payment.target.vote.toString().should.equal(dollarVote._id.toString());
                            payment.source.fan.toString().should.equal(dollarFan._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.USD.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.USD.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.USD.gr + config.payment.paidVotePrice.USD.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Artist -> $ Vote payment', function (done) {
                    Payment.createPayment('Artist', dollarArtist._id, 'Vote', dollarVote._id, -1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            console.dir(config);
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('USD');
                            payment.target.vote.toString().should.equal(dollarVote._id.toString());
                            payment.source.artist.toString().should.equal(dollarArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.USD.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.USD.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.USD.gr + config.payment.paidVotePrice.USD.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected € Fan -> $ Vote payment', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Vote', dollarVote._id, 42)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('USD');
                            payment.target.vote.toString().should.equal(dollarVote._id.toString());
                            payment.source.fan.toString().should.equal(euroFan._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.USD.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.USD.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.USD.gr + config.payment.paidVotePrice.USD.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected € Artist -> $ Vote payment', function (done) {
                    Payment.createPayment('Artist', euroArtist._id, 'Vote', dollarVote._id, -1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            console.dir(config);
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('USD');
                            payment.target.vote.toString().should.equal(dollarVote._id.toString());
                            payment.source.artist.toString().should.equal(euroArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.USD.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.USD.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.USD.gr + config.payment.paidVotePrice.USD.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Fan -> € Vote payment', function (done) {
                    Payment.createPayment('Fan', dollarFan._id, 'Vote', euroVote._id, 42)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('EUR');
                            payment.target.vote.toString().should.equal(euroVote._id.toString());
                            payment.source.fan.toString().should.equal(dollarFan._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.EUR.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.EUR.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.EUR.gr + config.payment.paidVotePrice.EUR.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Fan -> € Vote payment (mobile)', function (done) {
                    Payment.createFromMobileVote(euroVote._id)
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('completed');
                            payment.currency.should.equal('USD');
                            payment.target.vote.toString().should.equal(euroVote._id.toString());
                            payment.paymentType.should.equal('mobile');
                            payment.platform.should.equal('ios');
                            payment.transfered.should.be.false;
                            payment.amount.should.equal(config.payment.paidVotePrice.EUR.gr + config.payment.paidVotePrice.EUR.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected $ Artist -> € Vote payment', function (done) {
                    Payment.createPayment('Artist', dollarArtist._id, 'Vote', euroVote._id, -1)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            console.dir(config);
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.currency.should.equal('EUR');
                            payment.target.vote.toString().should.equal(euroVote._id.toString());
                            payment.source.artist.toString().should.equal(dollarArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            payment.shares.gr.should.equal(config.payment.paidVotePrice.EUR.gr);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.EUR.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.EUR.gr + config.payment.paidVotePrice.EUR.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it.skip('Creates expected Voucher -> Vote payment', function (done) {
                    Payment.createPayment('Voucher', voucher._id, 'Vote', euroVote._id, 42)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.target.vote.toString().should.equal(euroVote._id.toString());
                            payment.source.voucher.toString().should.equal(voucher._id.toString());
                            payment.paymentType.should.equal('preapproved');
                            payment.shares.gr.should.equal(-1);
                            payment.shares.artist.should.equal(config.payment.paidVotePrice.EUR.artist);
                            payment.amount.should.equal(config.payment.paidVotePrice.EUR.artist);
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

            });

            describe('for Vouchers', function () {
                it('Creates expected Fan -> Voucher payment', function (done) {
                    Payment.createPayment('Fan', euroFan._id, 'Voucher', voucher._id, 42)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.amount.should.equal(42);
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.target.voucher.toString().should.equal(voucher._id.toString());
                            payment.source.fan.toString().should.equal(euroFan._id.toString());
                            payment.paymentType.should.equal('chained');
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('Creates expected Artist -> Voucher payment', function (done) {
                    Payment.createPayment('Artist', euroArtist._id, 'Voucher', voucher._id, 42)
                        .then(function (newPayment) {
                            return Q.ninvoke(Payment.findOne({
                                _id: newPayment._id
                            }), 'exec');
                        })
                        .then(function (payment) {
                            payment.amount.should.equal(42);
                            payment.createdAt.should.not.be.null;
                            payment.state.should.equal('created');
                            payment.target.voucher.toString().should.equal(voucher._id.toString());
                            payment.source.artist.toString().should.equal(euroArtist._id.toString());
                            payment.paymentType.should.equal('chained');
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });
            });
            it('Does not create pament document when one or more "createListeners" fail', function (done) {
                var self = this;
                var lsnr = {
                    name: 'TestListener',
                    handler: function () {
                        var dfd = Q.defer();
                        Q.delay(10).then(function () {
                            //console.log("Failing createListener")
                            dfd.reject(new Error('this should fail'));
                        });
                        return dfd.promise;
                    }
                };

                Payment.createListeners.push(lsnr);

                Q.ninvoke(Payment.remove({}, true), 'exec')
                    .then(function () {
                        return Payment.createPayment('Fan', euroFan._id, 'Vote', euroVote._id, 666);
                    })
                    .then(function (pmt) {
                        done(pmt);
                    })
                    .fail(function (err) {
                        // console.dir(err);
                        Q.ninvoke(Payment.find({}), 'exec')
                            .then(function (pmts) {
                                pmts.length.should.equal(0);
                                done();
                            });
                    })
                    .fin(function () {
                        var pos = Payment.createListeners.indexOf(lsnr);
                        Payment.createListeners.splice(pos, 1);
                    });

            });
        });

        describe('Commit/Abort', function () {
            var payment;
            beforeEach(function (done) {
                Payment.createPayment('Fan', euroFan._id, 'Project', euroProject._id, 42, {}, 42, 1)
                    .then(function (pmt) {
                        payment = pmt;
                        done();
                    }).fail(function (error) {
                        console.dir(error);
                        done(error);
                    });
            });

            it('model.commit() sets the state to "completed" and updated the "completed" date', function (done) {
                payment.commit()
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('completed');
                        expect(pmt.completed).to.beforeTime(date);
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('model.commit() sets transfered to "true" if "usedGRCollectiveAddress == false"', function (done) {
                payment.commit()
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('completed');
                        pmt.transfered.should.be.true;
                        expect(pmt.completed).to.beforeTime(date);
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('model.commit() sets transfered to "false" if "usedGRCollectiveAddress == true"', function (done) {
                Payment.setUsedGRCollectiveAddress(payment._id, true)
                    .then(function (pmt) {
                        return pmt.commit();
                    })
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('completed');
                        pmt.transfered.should.be.false;
                        expect(pmt.completed).to.beforeTime(date);
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('Pyament.commit("paymentId") sets the state to "completed" and updated the "completed" date', function (done) {
                Payment.commit(payment._id)
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('completed');
                        expect(pmt.completed).to.beforeTime(date);
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('Pyament.commit("paymentId") works from state "created"', function (done) {
                Payment.commit(payment._id)
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('completed');
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('Pyament.commit("paymentId") works from state "commit-abort-pending"', function (done) {
                payment.state = 'commit-abort-pending';
                payment.completed = new Date();
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.commit(payment._id);
                    })
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('completed');
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('Payment.commit("paymentId") fails with error if payment is already completed', function (done) {
                payment.state = 'completed';
                payment.completed = new Date();
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.commit(payment._id);
                    })
                    .then(function () {
                        done(new Error('Expected Error has not been thrown'));
                    })
                    .fail(function (err) {
                        expect(err).to.equal('Commit of payment: ' + payment._id + ' failed!');
                        done();
                    });
            });

            it('Payment.commit("paymentId") works even if payment was aborted (handling PayPal\'s crap UI events)', function (done) {
                payment.state = 'aborted';
                payment.completed = new Date();
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.commit(payment._id);
                    })
                    .then(function (pmt) {
                        expect(pmt.state).to.equal('completed');
                        done();
                    })
                    .fail(function (err) {
                        done(err);
                    });
            });

            it('model.abort() sets the state to "aborted" and updated the "completed" date', function (done) {
                payment.abort()
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('aborted');
                        expect(pmt.completed).to.beforeTime(date);
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('model.abort() works form state "commit-abort-pending"', function (done) {
                payment.state = 'commit-abort-pending';
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return payment.abort();
                    })
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('aborted');
                        expect(pmt.completed).to.beforeTime(date);
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('Pyament.abort("paymentId") sets the state to "aborted" and updated the "completed" date', function (done) {
                Payment.abort(payment._id)
                    .then(function () {
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (pmt) {
                        var date = new Date();
                        pmt.state.should.equal('aborted');
                        expect(pmt.completed).to.beforeTime(date);
                        done();
                    })
                    .fail(function (err) {
                        console.dir(err);
                        done(err);
                    });
            });

            it('Payment.abort("paymentId") fails with error if payment is already completed', function (done) {
                payment.state = 'completed';
                payment.completed = new Date();
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.abort(payment._id);
                    })
                    .then(function () {
                        done(new Error('Expected Error has not been thrown'));
                    })
                    .fail(function (err) {
                        expect(err).to.equal('Abort of payment: ' + payment._id + ' failed!');
                        done();
                    });
            });

            it('Payment.abort("paymentId") fails with error if payment was aborted', function (done) {
                payment.state = 'aborted';
                payment.completed = new Date();
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.abort(payment._id);
                    })
                    .then(function () {
                        done(new Error('Expected Error has not been thrown'));
                    })
                    .fail(function (err) {
                        expect(err).to.equal('Abort of payment: ' + payment._id + ' failed!');
                        done();
                    });
            });

            it('Payment.lockForCommit("paymentId") sets the state to "commit-abort-pending"', function (done) {
                Payment.lockForCommit(payment._id)
                    .then(function (pmt) {
                        expect(pmt.state).to.equal('commit-abort-pending');
                        done();
                    })
                    .fail(function (err) {
                        done(err);
                    });
            });

            it('Payment.lockForCommit("paymentId") works even if payment was "aborted" (handling PayPal\'s crap UI events)', function (done) {
                payment.state = 'aborted';
                payment.completed = new Date();
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.lockForCommit(payment._id);
                    })
                    .then(function (pmt) {
                        expect(pmt.state).to.equal('commit-abort-pending');
                        done();
                    })
                    .fail(function (err) {
                        done(err);
                    });
            });

            it('Payment.lockForCommit("paymentId") fails when in state "completed"', function (done) {
                payment.state = 'completed';
                payment.completed = new Date();
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.lockForCommit(payment._id);
                    })
                    .then(function () {
                        done(new Error('Expected Error has not been thrown'));
                    })
                    .fail(function (err) {
                        expect(err).to.equal('Cannot lock Payment: ' + payment._id + '!');
                        done();
                    });
            });

            it('Payment.lockForCommit("paymentId") fails when in state "commit-abort-pending"', function (done) {
                payment.state = 'commit-abort-pending';
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.lockForCommit(payment._id);
                    })
                    .then(function () {
                        done(new Error('Expected Error has not been thrown'));
                    })
                    .fail(function (err) {
                        expect(err).to.equal('Cannot lock Payment: ' + payment._id + '!');
                        done();
                    });
            });

        });

        describe('Artist Payments', function () {
            it('Paymnet.listArtistPayments("artistId") returns list of all payments and the sum of all payments', function (done) {
                Q.all([
                    Payment.createPayment('Fan', euroFan._id, 'Project', euroProject._id, 14, {}, 14, 1)
                    .then(function (p) {
                        return p.commit();
                    }),
                    Payment.createPayment('Fan', euroFan._id, 'Project', euroProject._id, 10, {}, 10, 1)
                    .delay(50).then(function (p) {
                        return p.commit();
                    }),
                    Payment.createPayment('Fan', dollarFan._id, 'Vote', euroVote._id, -1)
                    .delay(100).then(function (p) {
                        return p.commit();
                    }),
                ])
                    .then(function () {
                        return Payment.listArtistPayments(euroArtist._id);
                    })
                    .then(function (pd) {
                        //console.log(JSON.stringify(pd, null, 2));
                        pd.sum.EUR.should.equal(25.2);

                        pd.payments[0].amount.should.equal(1.2);
                        pd.payments[0].currency.should.equal('EUR');

                        pd.payments[1].amount.should.equal(10);
                        pd.payments[1].currency.should.equal('EUR');

                        pd.payments[2].amount.should.equal(14);
                        pd.payments[2].currency.should.equal('EUR');
                        done();
                    }).fail(function (err) {
                        done(err);
                    });
            });
        });

        describe('With an existing payment', function () {
            var payment;
            beforeEach(function (done) {
                Payment.createPayment('Fan', euroFan._id, 'Project', euroProject._id, 42, {}, 42,  1)
                    .then(function (pmt) {
                        payment = pmt;
                        done();
                    }).fail(function (error) {
                        console.dir(error);
                        done(error);
                    });
            });
            it('Payment.getById("paymentId") return created payment with the given id', function (done) {
                Payment.getById(payment._id)
                    .then(function (pmt) {
                        expect(pmt._id.toString()).to.equal(payment._id.toString());
                        done();
                    });
            });

            it('Payment.getById("paymentId") populates the target.artist property including the paypal_email', function (done) {
                Payment.getById(payment._id)
                    .then(function (pmt) {
                        expect(pmt._id.toString()).to.equal(payment._id.toString());
                        expect(pmt.target.artist).to.exist;
                        expect(pmt.target.artist.paypal_email).to.equal('artist@mail.com');
                        done();
                    })
                    .fail(done);
            });

            it('Payment.pushFlowData("paymantId", data) - appends the provided data to the "paymentFlow" property', function (done) {
                Payment.pushFlowData(payment._id, {
                    prop: 'value',
                    prop2: 42
                })
                    .then(function (pmt) {
                        expect(pmt._id.toString()).to.equal(payment._id.toString());
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (fromDB) {
                        expect(fromDB.paymentFlow[0]).to.exist;
                        expect(fromDB.paymentFlow[0].prop).to.equal('value');
                        expect(fromDB.paymentFlow[0].prop2).to.equal(42);

                        return Payment.pushFlowData(payment._id, {
                            prop: 'value2',
                            prop2: 43
                        });
                    })
                    .then(function (pmt) {
                        expect(pmt._id.toString()).to.equal(payment._id.toString());
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    })
                    .then(function (fromDB) {
                        expect(fromDB.paymentFlow[1]).to.exist;
                        expect(fromDB.paymentFlow[1].prop).to.equal('value2');
                        expect(fromDB.paymentFlow[1].prop2).to.equal(43);

                        done();
                    })
                    .fail(done);
            });

            it('Payment.setUsedGRCollectiveAddress(paymaneId, true)- sets the property "usedGRCollectiveAddress" to true', function (done) {
                Payment.setUsedGRCollectiveAddress(payment._id, true)
                    .then(function (pmt) {
                        expect(pmt.usedGRCollectiveAddress).to.equal(true);
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    }).then(function (fromDb) {
                        expect(fromDb.usedGRCollectiveAddress).to.equal(true);
                        done();
                    }).fail(done);
            });

            it('Payment.setUsedGRCollectiveAddress(paymaneId, false)- sets the property "usedGRCollectiveAddress" to false', function (done) {
                payment.usedGRCollectiveAddress = false;
                Q.ninvoke(payment, 'save')
                    .then(function () {
                        return Payment.setUsedGRCollectiveAddress(payment._id, true);
                    }).then(function (pmt) {
                        expect(pmt.usedGRCollectiveAddress).to.equal(true);
                        return Q.ninvoke(Payment.findOne({
                            _id: payment._id
                        }), 'exec');
                    }).then(function (fromDb) {
                        expect(fromDb.usedGRCollectiveAddress).to.equal(true);
                        done();
                    }).fail(done);
            });
        });

        describe('Plugins', function () {

            describe('Project', function () {
                var project;
                var dollarProject;
                var fan;
                var dollarFan;
                var artist;
                var dollarArtist;
                beforeEach(function (done) {
                    Q.all([
                        projectUtil.savedProject(),
                        projectUtil.savedProject(),
                        fanUtil.savedFan(),
                        fanUtil.savedFan(),
                        artistUtil.savedArtist(),
                        artistUtil.savedArtist()
                    ]).spread(function (proj, proj2, f, df, a, da) {
                        artist = a;
                        project = proj;
                        project.currency = 'EUR';
                        project.moneyToRaise = 666;
                        project.state = 'published';
                        project.artist = artist._id;
                        fan = f;
                        dollarFan = df;
                        dollarFan.currency = 'USD';

                        dollarArtist = da;
                        dollarArtist.currency = 'USD';

                        return Q.all([
                            Q.ninvoke(dollarFan, 'save'),
                            Q.ninvoke(dollarArtist, 'save'),
                            Q.ninvoke(project, 'save'),
                        ]);
                    })
                        .then(function () {
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });

                });

                it('Registers as "createListener"', function () {
                    var lsnr = _.find(Payment.createListeners, function (lsnr) {
                        return lsnr.name === 'ProjectCreateListener';
                    });
                    expect(lsnr).to.exist;
                });

                it('Registers as "commitListener"', function () {
                    var lsnr = _.find(Payment.commitListeners, function (lsnr) {
                        return lsnr.name === 'ProjectCommitListener';
                    });
                    expect(lsnr).to.exist;
                });

                it('Paymnet.listProjectPayments("projectId") returns list of all payments and the sum of all payments', function (done) {
                    Q.all([
                        Payment.createPayment('Fan', fan._id, 'Project', project._id, 14, {}, 14, 1)
                        .then(function (p) {
                            return p.commit();
                        }),
                        Payment.createPayment('Fan', fan._id, 'Project', project._id, 10, {}, 10, 1)
                        .delay(100).then(function (p) {
                            return p.commit();
                        }),
                        Payment.createPayment('Fan', dollarFan._id, 'Project', project._id, 13, {}, 13, 1)
                        .delay(200).then(function (p) {
                            return p.commit();
                        }),
                        Payment.createPayment('Fan', fan._id, 'Project', project._id, 18, {}, 18, 1)
                        .delay(300).then(function (p) {
                            return p.commit();
                        }),
                        Payment.createPayment('Fan', dollarFan._id, 'Project', project._id, 29, {}, 29, 1)
                        .delay(400).then(function (p) {
                            return p.commit();
                        }),
                    ])
                        .then(function () {
                            return Payment.listProjectPayments(project._id);
                        })
                        .then(function (pd) {
                            //console.log(JSON.stringify(pd, null, 2));
                            pd.sum.USD;

                            pd.payments[0].amount.should.equal(14);
                            pd.payments[0].currency.should.equal('USD');

                            pd.payments[1].amount.should.equal(10);
                            pd.payments[1].currency.should.equal('USD');

                            pd.payments[2].amount.should.equal(13);
                            pd.payments[2].currency.should.equal('USD');

                            pd.payments[3].amount.should.equal(18);
                            pd.payments[3].currency.should.equal('USD');

                            pd.payments[4].amount.should.equal(29);
                            pd.payments[4].currency.should.equal('USD');
                            done();
                        }).fail(done);

                });

                it('On Commit sets the Project to state "completed" when enought money was raised"', function (done) {
                    Payment.createPayment('Fan', fan._id, 'Project', project._id, 222, {}, 222, 1)
                        .then(function (p) {
                            return p.commit();
                        })
                        .then(function () {
                            return Q.ninvoke(Project.findOne({
                                _id: project._id
                            }), 'exec');
                        }).then(function (p) {
                            p.state.should.equal('published');
                        })
                        .then(function () {
                            return Payment.createPayment('Fan', fan._id, 'Project', project._id, 444, {}, 444, 1)
                                .then(function (p) {
                                    return p.commit();
                                })
                                .then(function () {
                                    return Q.ninvoke(Project.findOne({
                                        _id: project._id
                                    }), 'exec');
                                });
                        })
                        .then(function (p) {
                            p.state.should.equal('completed');
                            done();
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });

                it('On Commit EMITS "project:completed" event with the project as data"', function (done) {
                    eventSpy.spy('project:completed', function (event, data) {
                        data.project._id.toString().should.equal(project._id.toString());
                        data.project.state.should.equal('completed');
                    }, done);

                    Payment.createPayment('Fan', fan._id, 'Project', project._id, 666, {}, 666, 1)
                        .then(function (p) {
                            return p.commit();
                        })
                        .then(function () {
                            return Q.ninvoke(Project.findOne({
                                _id: project._id
                            }), 'exec');
                        }).then(function (p) {
                            p.state.should.equal('completed');
                        })
                        .fail(function (err) {
                            done(err);
                        });
                });
            });
        });
    });
});
