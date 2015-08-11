/* global describe, it, before, after, beforeEach, afterEach */
'use strict';

var config = require('../../lib/database'),
    models = require('../../models');

var mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId;

var fanFactory = require('../util/fan');
var artistFactory = require('../util/artist');
var Fan = require('../../models/fan');
var Vote = mongoose.model('Vote');
var ObjectId = mongoose.Types.ObjectId;

var Voucher = require('../../models/voucher');
var VoucherTemplate = require('../../models/voucher-template');
var Q = require('q');

var should = require('should'),
    chai = require('chai'),
    expect = chai.expect;

var server = require('../../index');

var validVoucherTemplate = {
    title: 'Test',
    amount: {
        euro: 50,
        dollar: 80
    },
    votes: 100,
};

return ;

describe('REST Voucher', function () {
    describe('Templates', function () {
        beforeEach(function (done) {
            VoucherTemplate.remove({}, done);
        });

        it('should return an empty list if no voucher is saved', function (done) {
            server.inject({
                method: 'GET',
                url: '/voucher-templates',
                headers: {
                    'Content-type': 'application/json'
                }
            }, function (reply) {
                expect(reply.result).to.eql([]);
                done();
            });
        });

        it('should create a valid voucher', function (done) {
            server.inject({
                method: 'POST',
                url: '/voucher-templates',
                payload: validVoucherTemplate,
                headers: {
                    'Content-type': 'application/json'
                }
            }, function (res) {
                server.inject({
                    method: 'GET',
                    url: '/voucher-templates',
                    headers: {
                        'Content-type': 'application/json'
                    }
                }, function (reply) {
                    var vouchers = reply.result;

                    expect(vouchers.length).to.equal(1);
                    expect(vouchers[0].amount).to.have.property('euro', 50);
                    expect(vouchers[0]).to.have.property('votes', 100);
                    expect(vouchers[0]).to.have.property('active', false);
                    done();
                });
            });
        });

        it('should activate and deactivate a voucher', function (done) {
            server.inject({
                method: 'POST',
                url: '/voucher-templates',
                payload: validVoucherTemplate,
                headers: {
                    'Content-type': 'application/json'
                }
            }, function (res) {
                server.inject({
                    method: 'GET',
                    url: '/voucher-templates',
                    headers: {
                        'Content-type': 'application/json'
                    }
                }, function (reply) {
                    var vouchers = reply.result;
                    server.inject({
                        method: 'PUT',
                        url: '/voucher-templates/' + vouchers[0]._id + '/activate',
                    }, function (reply) {
                        server.inject({
                            method: 'GET',
                            url: '/voucher-templates/' + vouchers[0]._id,
                            headers: {
                                'Content-type': 'application/json'
                            }
                        }, function (reply) {
                            expect(reply.result).to.have.property('active', true);

                            server.inject({
                                method: 'PUT',
                                url: '/voucher-templates/' + vouchers[0]._id + '/deactivate',
                            }, function (reply) {
                                server.inject({
                                    method: 'GET',
                                    url: '/voucher-templates/' + vouchers[0]._id,
                                    headers: {
                                        'Content-type': 'application/json'
                                    }
                                }, function (reply) {
                                    expect(reply.result).to.have.property('active', false);

                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    describe('User', function () {
        var fan, template;

        beforeEach(Voucher.remove.bind(Voucher, {}));

        beforeEach(function (done) {
            VoucherTemplate.remove({}, function () {
                template = new VoucherTemplate(validVoucherTemplate);
                template.save(done);
            });
        });

        beforeEach(function (done) {
            Fan.remove({}, function (err) {
                if (err) return done(err);

                fanFactory.savedFan().then(function (_fan) {
                    fan = _fan;
                    done();
                }).fail(done);
            });
        });

        it('should add a voucher', function (done) {
            server.inject({
                method: 'POST',
                url: '/fans/' + fan._id + '/vouchers',
                payload: JSON.stringify({
                    template: template._id
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }, function (res) {
                return Q.ninvoke(Voucher, 'findOne', {
                    user: {
                        id: fan._id,
                        role: 'fan'
                    }
                }).then(function (voucher) {
                    expect(voucher.template.toString()).to.equal(template._id.toString());
                    expect(voucher.status).to.equal('pending');
                    done();
                }).fail(done);
            });
        });

        it('should activate voucher', function (done) {
            server.inject({
                method: 'POST',
                url: '/fans/' + fan._id + '/vouchers',
                payload: JSON.stringify({
                    template: template._id
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }, function (res) {
                return Q.ninvoke(Voucher, 'findOne', {
                    user: {
                        id: fan._id,
                        role: 'fan'
                    }
                }).then(function (voucher) {
                    server.inject({
                        method: 'PUT',
                        url: '/fans/' + fan._id + '/vouchers/' + voucher._id + '/activate',
                        payload: JSON.stringify({
                            template: template._id
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }, function (res) {
                        return Q.ninvoke(Voucher, 'findOne', {
                            user: {
                                id: fan._id,
                                role: 'fan'
                            }
                        }).then(function (voucher) {
                            expect(voucher.status).to.equal('processed');

                            done();
                        }).fail(done);
                    });


                }).fail(done);
            });
        });

        describe('active vouchers', function () {
            var expiringVoucher;
            var vote;
            var artist;

            var makeProcessedVoucher = (function (done) {
                var voucher = new Voucher({
                    user: {
                        id: fan._id,
                        role: 'fan'
                    },
                    title: template.title,
                    template: template._id,
                    amount: {
                        EUR: 100,
                        USD: 200
                    },
                    currency: 'EUR',
                    votes: 200,
                    status: 'processed'
                });

                voucher.save(done);
            });

            beforeEach(function (done) {
                artistFactory.savedArtist(function (err, _artist) {
                    artist = _artist;
                    done(err);
                });
            });

            beforeEach(function (done) {
                Vote.remove({}, function (err, d) {
                    vote = new Vote({
                        platform: 'ios',
                        type: 'facebook',
                        artist: artist._id,
                        song: ObjectId(),
                        voter_artist: ObjectId()
                    });
                    vote.save(done);
                });
            });

            beforeEach(makeProcessedVoucher);
            beforeEach(makeProcessedVoucher);
            beforeEach(makeProcessedVoucher);
            beforeEach(function (done) {
                makeProcessedVoucher(function (err, voucher) {
                    voucher.expiresAt = new Date(0);
                    voucher.save(done);
                })
            });

            beforeEach(function (done) {
                makeProcessedVoucher(function (err, voucher) {
                    voucher.expiresAt = new Date();
                    voucher.expiresAt.setMonth(voucher.expiresAt.getMonth() + 1);
                    voucher.save(done);

                    expiringVoucher = voucher;
                })
            });

            it('should list active vouchers', function (done) {
                server.inject({
                    method: 'GET',
                    url: '/fans/' + fan._id + '/vouchers/active',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, function (res) {
                    var vouchers = res.result;
                    expect(vouchers.length).to.equal(4);
                    done();
                });
            });

            it('should use a vote from the next expiring voucher', function (done) {
                server.inject({
                    method: 'PUT',
                    url: '/fans/' + fan._id + '/vouchers/use',
                    payload: {
                        voteId: vote._id
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, function (res) {
                    expect(res.result.votesLeft).to.equal(199);
                    Voucher.findById(expiringVoucher._id, function (err, voucher) {
                        if (err) done(err);
                        expect(voucher.votesLeft).to.equal(199);
                        done();
                    });
                });
            });
        });
    });
});
