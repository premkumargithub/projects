
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

    describe('Validation', function () {

        it('fails when source.type === "Artist" but artist is not a valid objectId', function (done) {
            var model = new Payment();
            model.source.type = 'Artist';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors['source.type']);
                    done();
                });
        });

        it('fails when source.type === "Fan" but fan is not a vaild objectId', function (done) {
            var model = new Payment();
            model.source.type = 'Fan';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors['source.type']);
                    done();
                });
        });

        it('passes when source.type === "Fan" and fan is a vaild objectId', function (done) {
            var model = new Payment();
            model.target.type = 'Project';
            model.target.project = objectId();
            model.target.artist = objectId();
            model.amount = 42;
            model.source.type = 'Fan';
            model.source.fan = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'chained';
            Q.ninvoke(model, 'save')
                .then(function (err) {
                    done();
                }).fail(done);
        });
        it('passes when source.type === "Artist" and artist is a vaild objectId', function (done) {
            var model = new Payment();
            model.target.type = 'Project';
            model.target.project = objectId();
            model.target.artist = objectId();
            model.amount = 42;
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'chained';
            Q.ninvoke(model, 'save')
                .then(function (err) {
                    done();
                }).fail(done);
        });

        it('fails when target.type === "Project" and project is not a vaild objectId', function (done) {
            var model = new Payment();
            model.target.type = 'Project';
            model.target.artist = objectId();
            model.amount = 42;
            model.source.type = 'Fan';
            model.source.fan = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'simple';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors['target.type']);
                    done();
                });
        });

        it('fails when target.type === "Vote" and vote is not a vaild objectId', function (done) {
            var model = new Payment();
            model.target.type = 'Vote';
            model.target.artist = objectId();
            model.amount = 42;
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'simple';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors['target.type']);
                    done();
                });
        });

        it('passes when target.type === "Project" and project is a vaild objectId', function (done) {
            var model = new Payment();
            model.target.type = 'Project';
            model.target.project = objectId();
            model.target.artist = objectId();
            model.amount = 42;
            model.source.type = 'Fan';
            model.source.fan = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'chained';
            Q.ninvoke(model, 'save')
                .then(function (err) {
                    done();
                }).fail(done);
        });

        it('passes when target.type === "Vote" and vote is a vaild objectId', function (done) {
            var model = new Payment();
            model.target.type = 'Vote';
            model.target.vote = objectId();
            model.target.artist = objectId();
            model.amount = 42;
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'chained';
            Q.ninvoke(model, 'save')
                .then(function (err) {
                    done();
                }).fail(done);
        });

        it('fails when target.artist is not set', function (done) {
            var model = new Payment();
            model.target.type = 'Vote';
            model.target.vote = objectId();
            model.amount = 42;
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'simple';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors['target.artist']);
                    done();
                });
        });
        it('fails when amount is not set', function (done) {
            var model = new Payment();
            model.target.type = 'Vote';
            model.target.vote = objectId();
            model.target.artist = objectId();
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'simple';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors.amount);
                    done();
                });
        });

        it('fails when state is not set', function (done) {
            var model = new Payment();
            model.target.type = 'Vote';
            model.target.vote = objectId();
            model.target.artist = objectId();
            model.state = null;
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'simple';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors.state);
                    done();
                });
        });

        it('fails when state === "completed" but "completed" date is not set', function (done) {
            var model = new Payment();
            model.target.type = 'Vote';
            model.target.vote = objectId();
            model.target.artist = objectId();
            model.state = 'completed';
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'simple';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors.state);
                    done();
                });
        });

        it('fails when state === "aborted" but "completed" date is not set', function (done) {
            var model = new Payment();
            model.target.type = 'Vote';
            model.target.vote = objectId();
            model.target.artist = objectId();
            model.state = 'aborted';
            model.source.type = 'Artist';
            model.source.artist = objectId();
            model.shares = {
                artist: -1,
                gr: 42
            };
            model.paymentType = 'simple';
            Q.ninvoke(model, 'save')
                .fail(function (err) {
                    should.exists(err.errors.state);
                    done();
                });
        });

        describe('Fan -> Vote payment', function () {
            it('fails when source.type === "Fan" & target.type === "Vote" and paymentType === "simple" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'simple';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });
            it('fails when source.type === "Fan" & target.type === "Vote" and paymentType === "preapproved" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'preapproved';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });

            it('passes when source.type === "Fan" & target.type === "Vote" and paymentType === "chained" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'chained';
                Q.ninvoke(model, 'save')
                    .then(function (err) {
                        done();
                    })
                    .fail(done);
            });
        });
        describe('Fan -> Project payment', function () {
            it('fails when source.type === "Fan" & target.type === "Project" and paymentType === "simple" ', function (done) {
                var model = new Payment();
                model.target.type = 'Project';
                model.target.project = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'simple';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });
            it('fails when source.type === "Fan" & target.type === "Project" and paymentType === "preapproved" ', function (done) {
                var model = new Payment();
                model.target.type = 'Project';
                model.target.project = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'preapproved';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });

            it('passes when source.type === "Fan" & target.type === "Project" and paymentType === "chained" ', function (done) {
                var model = new Payment();
                model.target.type = 'Project';
                model.target.project = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'chained';
                Q.ninvoke(model, 'save')
                    .then(function (err) {
                        done();
                    })
                    .fail(done);
            });
        });

        describe('Artist -> Vote payment', function () {
            it('fails when source.type === "Artist" & target.type === "Vote" and paymentType === "simple" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'simple';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });
            it('fails when source.type === "Artist" & target.type === "Vote" and paymentType === "preapproved" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'preapproved';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });

            it('passes when source.type === "Artist" & target.type === "Vote" and paymentType === "chained" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'chained';
                Q.ninvoke(model, 'save')
                    .then(function (err) {
                        done();
                    })
                    .fail(done);
            });
        });
        describe('Artist -> Project payment', function () {
            it('fails when source.type === "Artist" & target.type === "Project" and paymentType === "simple" ', function (done) {
                var model = new Payment();
                model.target.type = 'Project';
                model.target.project = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'simple';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });
            it('fails when source.type === "Artist" & target.type === "Project" and paymentType === "preapproved" ', function (done) {
                var model = new Payment();
                model.target.type = 'Project';
                model.target.project = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'preapproved';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });

            it('passes when source.type === "Artist" & target.type === "Project" and paymentType === "chained" ', function (done) {
                var model = new Payment();
                model.target.type = 'Project';
                model.target.project = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'chained';
                Q.ninvoke(model, 'save')
                    .then(function (err) {
                        done();
                    })
                    .fail(done);
            });
        });

        describe('Artist -> Voucher payment', function () {
            it('fails when source.type === "Artist" & target.type === "Voucher" and paymentType === "simple" ', function (done) {
                var model = new Payment();
                model.target.type = 'Voucher';
                model.target.voucher = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'simple';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });
            it('fails when source.type === "Artist" & target.type === "Voucher" and paymentType === "preapproved" ', function (done) {
                var model = new Payment();
                model.target.type = 'Voucher';
                model.target.voucher = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'preapproved';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });

            it('passes when source.type === "Artist" & target.type === "Voucher" and paymentType === "chained" ', function (done) {
                var model = new Payment();
                model.target.type = 'Voucher';
                model.target.voucher = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Artist';
                model.source.artist = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'chained';
                Q.ninvoke(model, 'save')
                    .then(function (err) {
                        done();
                    })
                    .fail(done);
            });
        });

        describe('Fan -> Voucher payment', function () {
            it('fails when source.type === "Fan" & target.type === "Voucher" and paymentType === "simple" ', function (done) {
                var model = new Payment();
                model.target.type = 'Voucher';
                model.target.voucher = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'simple';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });
            it('fails when source.type === "Fan" & target.type === "Voucher" and paymentType === "preapproved" ', function (done) {
                var model = new Payment();
                model.target.type = 'Voucher';
                model.target.voucher = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'preapproved';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });

            it('passes when source.type === "Fan" & target.type === "Voucher" and paymentType === "chained" ', function (done) {
                var model = new Payment();
                model.target.type = 'Voucher';
                model.target.voucher = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Fan';
                model.source.fan = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'chained';
                Q.ninvoke(model, 'save')
                    .then(function (err) {
                        done();
                    })
                    .fail(done);
            });
        });

        describe('Voucher -> Vote payment', function () {
            it('fails when source.type === "Voucher" & target.type === "Vote" and paymentType === "simple" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Voucher';
                model.source.voucher = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'simple';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });
            it('fails when source.type === "Voucher" & target.type === "Vote" and paymentType === "chained" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Voucher';
                model.source.voucher = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'chained';
                Q.ninvoke(model, 'save')
                    .then(function () {
                        done(new Error('this should fail'));
                    })
                    .fail(function (err) {
                        should.exists(err.errors.paymentType);
                        done();
                    });
            });

            it('passes when source.type === "Voucher" & target.type === "Vote" and paymentType === "preapproved" ', function (done) {
                var model = new Payment();
                model.target.type = 'Vote';
                model.target.vote = objectId();
                model.target.artist = objectId();
                model.amount = 42;
                model.source.type = 'Voucher';
                model.source.voucher = objectId();
                model.shares = {
                    artist: -1,
                    gr: 42
                };
                model.paymentType = 'preapproved';
                Q.ninvoke(model, 'save')
                    .then(function (err) {
                        done();
                    })
                    .fail(done);
            });
        });
    });
});
