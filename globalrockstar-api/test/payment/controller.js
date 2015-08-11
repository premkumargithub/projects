/* globals describe, it, before, after, beforeEach, afterEach */
/* jshint -W030 */

'use strict';

var config = require('../../lib/database');
var models = require('../../models');
var mongoose = require('mongoose');
var _ = require('lodash');
var Q = require('q');
var Project = mongoose.model('Project');
var Payment = mongoose.model('Payment');
var should = require('should');
var chai = require('chai');
var expect = chai.expect;
var dbUtil = require('../util/db');
var artistUtil = require('../util/artist');
var songUtil = require('../util/song');
var projectUtil = require('../util/project');
var fanUtil = require('../util/fan');
var voteUtil = require('../util/vote');
var voucherUtil = require('../util/voucher');
var eventSpy = require('../util/eventSpy');
var server = require('../../index');
var wrapper = require('../util/injectWrapper')(server);
var objectId = mongoose.Types.ObjectId;
var Contest = require('../../models/contest');
var fromNow = function (n) {
    var today = new Date();
    return today.setDate(today.getDate() + n);
};

describe('REST Payment', function () {
    before(function (done) {
        dbUtil.resetDB().then(function () {
            done();

            var today = new Date();

            var obj_data = {
                name: "2014",
                cfe: {
                    time: {
                        start: fromNow(-2),
                        end: fromNow(-1)
                    }
                },
                np: {
                    time: {
                        start: fromNow(0),
                        end: fromNow(2)
                    }
                },
                globalfinalsQualification: {
                    time: {
                        start: fromNow(2),
                        end: fromNow(3)
                    }
                },
                globalfinalsBest64: {
                    time: {
                        start: fromNow(3),
                        end: fromNow(4)
                    }
                },
                globalfinalsBest16: {
                    time: {
                        start: fromNow(4),
                        end: fromNow(5)
                    }
                }
            };

            Contest.create(obj_data).exec(function (err, res) {
                console.log(err);
                done();
            });

        });
    });

    afterEach(function (done) {
        dbUtil.resetDB().then(function () {
            done();
        });
    });

    var paymentId;
    var payment;
    var project;
    var fan;
    var dollarFan;
    var vote;
    var artist;
    var voucher;
    beforeEach(function (done) {
        Q.all([
            projectUtil.savedProject(),
            fanUtil.savedFan(),
            fanUtil.savedFan(),
            voteUtil.savedVote(),
            artistUtil.savedArtist(),
        ]).spread(function (proj, f, df, v, a) {
            artist = a;
            project = proj;
            project.state = 'published';
            project.artist = artist._id;
            fan = f;
            dollarFan = df;
            vote = v;
            vote.artist = artist._id;
            dollarFan.currency = 'USD';
            return Q.all([
                voucherUtil.savedVoucher(fan._id, 'fan'),
                Q.ninvoke(dollarFan, 'save'),
                Q.ninvoke(project, 'save'),
                Q.ninvoke(vote, 'save'),
            ]);
        }).spread(function (voc) {
            voucher = voc;
            return Payment.createPayment('Fan', fan._id, 'Project', project._id, 42, {}, 42, 1);
        }).then(function (pmt) {
            payment = pmt;
            done();
        }).fail(function (error) {
            console.dir(error);
            done(error);
        });

    });

    describe('Payment creation', function () {

        it('POST /payments/:sourceType/:sourceId/:targetType/:targetId/:amount/create creates a payment with the paylod as "userdata"', function (done) {
            Q.ninvoke(wrapper, 'inject', {
                method: 'POST',
                url: '/payments/fan/' + fan._id + '/project/' + project._id + '/42/create',
                payload: JSON.stringify({
                    customProp: 'withData',
                    undNoAns: 42,
                    dollarAmount: 42,
                    exchangeRate: 1
                }),
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function (res) {
                expect(res.statusCode).to.equal(201);
                var r = res.result;
                return Q.ninvoke(Payment.findOne({
                    _id: r._id
                }), 'exec');
            }).then(function (pmt) {
                if (!pmt) {
                    done(new Error('Payment was not saved in database'));
                }
                pmt.amount.should.equal(42);
                expect(pmt.userdata).to.exist;
                pmt.userdata.customProp.should.equal('withData');
                pmt.userdata.undNoAns.should.equal(42);
                done();
            }).fail(done);
        });
    });

    it('PUT /payments/:paymentId/commit commits payment', function (done) {
        Payment.createPayment('Fan', fan._id, 'Project', project._id, 14, {}, 14, 1)
            .then(function (p) {
                server.inject({
                    method: 'PUT',
                    url: '/payments/' + p._id + '/commit',
                }, function (res) {
                    expect(res.statusCode).to.equal(200);
                    var r = res.result;
                    Q.ninvoke(Payment.findOne({
                        _id: r._id
                    }), 'exec')
                        .then(function (pmt) {
                            if (!pmt) {
                                done(new Error('Payment was not saved in database'));
                            }
                            pmt.state.should.equal('completed');
                            done();
                        });
                });
            });
    });
    it('PUT /payments/:paymentId/commit returns bad request if commit fails', function (done) {
        server.inject({
            method: 'PUT',
            url: '/payments/' + objectId() + '/commit',
        }, function (res) {
            expect(res.statusCode).to.equal(400);
            expect(res.result.message.indexOf('Commit of payment')).should.not.equal(-1);
            done();
        });
    });

    it('PUT /payments/:paymentId/abort abort payment', function (done) {
        Payment.createPayment('Fan', fan._id, 'Project', project._id, 14, {}, 14, 1)
            .then(function (p) {
                server.inject({
                    method: 'PUT',
                    url: '/payments/' + p._id + '/abort',
                    payload: JSON.stringify({
                        customProp: 'withData',
                        undNoAns: 42,
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, function (res) {
                    expect(res.statusCode).to.equal(200);
                    var r = res.result;
                    Q.ninvoke(Payment.findOne({
                        _id: r._id
                    }), 'exec')
                        .then(function (pmt) {
                            if (!pmt) {
                                done(new Error('Payment was not saved in database'));
                            }
                            pmt.state.should.equal('aborted');
                            pmt.paymentFlow[0].customProp.should.equal('withData');
                            pmt.paymentFlow[0].undNoAns.should.equal(42);
                            done();
                        })
                        .fail(done);
                });
            });
    });

    it('PUT /payments/:paymentId/commit returns bad request if abort fails', function (done) {
        var id = objectId();
        server.inject({
            method: 'PUT',
            url: '/payments/' + id + '/abort',
        }, function (res) {
            expect(res.statusCode).to.equal(400);
            expect(res.result.message.indexOf('Abort of payment')).should.not.equal(-1);
            done();
        });
    });

    describe('Artist', function () {
        it('GET /artists/:artistId/payments returns all paymemnts for the artist', function (done) {
            Q.all([
                Payment.createPayment('Fan', fan._id, 'Project', project._id, 14, {}, 14, 1)
                .then(function (p) {
                    return p.commit();
                }),
                Payment.createPayment('Fan', fan._id, 'Project', project._id, 10, {}, 10, 1)
                .delay(100).then(function (p) {
                    return p.commit();
                }),
                Payment.createPayment('Fan', dollarFan._id, 'Vote', vote._id, -1)
                .delay(200).then(function (p) {
                    return p.commit();
                }),
            ])
                .then(function () {
                    return Q.ninvoke(wrapper, 'inject', {
                        method: 'GET',
                        url: '/artists/' + artist._id + '/payments',
                    });
                }).then(function (res) {
                    expect(res.statusCode).to.equal(200);
                    var pd = res.result;

                    pd.sum.USD.should.equal(25.6);

                    pd.payments[0].amount.should.equal(1.6);
                    pd.payments[0].currency.should.equal('USD');

                    pd.payments[1].amount.should.equal(10);
                    pd.payments[1].currency.should.equal('USD');

                    pd.payments[2].amount.should.equal(14);
                    pd.payments[2].currency.should.equal('USD');

                    done();
                }).fail(function (err) {
                    done(err);
                });

        });
    });
    describe('Project', function () {
        it('GET /payments/projects/:projectId returns all paymemnts for the project', function (done) {
            Q.all([
                Payment.createPayment('Fan', fan._id, 'Project', project._id, 14, {}, 14, 1)
                .then(function (p) {
                    return p.commit();
                }),
                Payment.createPayment('Fan', fan._id, 'Project', project._id, 10, {}, 10, 1)
                .delay(100).then(function (p) {
                    return p.commit();
                }),
                Payment.createPayment('Fan', dollarFan._id, 'Vote', vote._id, 18)
                .delay(200).then(function (p) {
                    return p.commit();
                }),
            ])
                .then(function () {
                    server.inject({
                        method: 'GET',
                        url: '/payments/projects/' + project._id,
                    }, function (res) {
                        expect(res.statusCode).to.equal(200);
                        var pd = res.result;

                        pd.sum.USD.should.equal(24);
                        pd.payments.length.should.equal(2);

                        pd.payments[0].amount.should.equal(14);
                        pd.payments[0].currency.should.equal('USD');

                        pd.payments[1].amount.should.equal(10);
                        pd.payments[1].currency.should.equal('USD');

                        done();
                    });

                }).fail(function (err) {
                    done(err);
                });

        });
    });
});
