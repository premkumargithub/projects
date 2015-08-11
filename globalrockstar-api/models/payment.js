'use strict';
/**
 *   @module Model:Payment
 *   @description This module is used for providing schema services to Payment model
 *   @requires module:../config
 *   @requires module:q
 *   @requires module:lodash
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 *   @requires module:./payment.project
 *   @requires module:./payment.voucher
 *   @requires module:./payment.vote
 *   @requires module:./payment.transfer
 *   @requires module:./vote
 *   @requires module:./exchange-rate
 *   @requires module:../public/configs/currencies
 **/
var config = require('../config');
var Q = require('q');
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamps');
var ObjectId = mongoose.Types.ObjectId;
var projectPlugin = require('./payment.project');
var voucherPlugin = require('./payment.voucher');
var votePlugin = require('./payment.vote');
var transferPlugin = require('./payment.transfer');
var Vote = require('./vote');
var ExchangeRate = require('./exchange-rate');
var currencies = require('../public/configs/currencies');

/**
 * @name Model:Payment.twoCommas
 * @function
 * @param {Number} float Some value
 * @functiondesc: Used to truncate the number two digits after decimal
 * @return {Number} Decimal value with two digits after decimal
 */
var twoCommas = function (float) {
    return parseFloat(float).toFixed(2);
};

/**
 * @description: Legacy currency defined
 */
var legacyCurrencyName = {
    EUR: 'euro',
    USD: 'dollar'
};

/**
 * @name Model:Payment.currencyName
 * @function
 * @param {Number} float Some value
 * @functiondesc: checks currency code and returns currency
 * @return {String} Currency Name string
 */
function currencyName(currency) {
    if (currency === 'euro') {
        console.warn("USING LEGACY CURRYNCY NAME: " + currency);
        return 'EUR';
    }
    if (currency === 'dollar') {
        console.warn("USING LEGACY CURRYNCY NAME: " + currency);
        return 'USD';
    }
    return currency;
}

//function validAmount(amount, currency) {
//var c = _.find(currencies, function (c) {
//return c.code === currency;
//});

//console.log(JSON.stringify(c, null, 2));

//if (c && c.options && c.options === 'nodecimal') {
//console.log("Round i will!");
//amount = Math.round(amount);
//} else {
//amount = Math.round(amount * 100) / 100;
//}
//return amount;
//}

/**
 * @namespace
 * @name Model:Project.PaymentSchema
 * @desc Create the schema for Payment table in mongo DB
 * @prop Schema {object} - Create the schema for the mongoose db
 **/
var PaymentSchema = new Schema({
    source: {
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Artist'
        },

        fan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fan'
        },

        voucher: {
            type: Schema.Types.ObjectId,
            ref: 'Voucher'
        },

        type: {
            type: String,
            enum: ['Artist', 'Fan', 'Voucher', 'Trustee'],
            required: true,
            validate: function validateSource(value) {

                if (this.source.type === 'Artist' && this.source.artist && ObjectId.isValid(this.source.artist.toString())) {
                    return true;
                }
                if (this.source.type === 'Fan' && this.source.fan && ObjectId.isValid(this.source.fan.toString())) {
                    return true;
                }
                if (this.source.type === 'Voucher' && this.source.voucher && ObjectId.isValid(this.source.voucher.toString())) {
                    return true;
                }
                if (this.source.type === 'Trustee') {
                    return true;
                }
                return false;
            }

        }
    },
    target: {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        },

        vote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vote'
        },

        voucher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vote'
        },

        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Artist'
        },

        type: {
            type: String,
            enum: ['Project', 'Vote', 'Voucher', 'Artist'],
            required: true,
            validate: function validateTarget(value) {
                if (this.target.type === 'Project' && this.target.project && ObjectId.isValid(this.target.project.toString())) {
                    return true;
                }
                if (this.target.type === 'Vote' && this.target.vote && ObjectId.isValid(this.target.vote.toString())) {
                    return true;
                }

                if (this.target.type === 'Voucher' && this.target.voucher && ObjectId.isValid(this.target.voucher.toString())) {
                    return true;
                }

                if (this.target.type === 'Artist' && this.target.artist && ObjectId.isValid(this.target.artist.toString())) {
                    return true;
                }

                return false;
            }
        }
    },
    amount: {
        type: Number,
        required: true
    },
    // For project payments we store the dollar amount the fan wanted to donate to be abe to calculate of the completion rate
    dollarAmount: {
        type: Number,
        required: true,
        default: -1
    },
    // For project payments done in foreign currencies the exchange rate used to calculate the payment amount is stored
    exchangeRate: {
        type: Number,
        required: true,
        default: -1
    },
    paymentType: {
        type: String,
        enum: ['simple', 'chained', 'preapproved', 'mobile'],
        required: true,
        validate: function validatePaymentType(value) {
            if ((this.source.type === 'Fan' || this.source.type === 'Artist') &&
                (this.target.type === 'Vote' || this.target.type === 'Project') &&
                this.paymentType === 'chained') {
                return true;
            }

            if ((this.source.type === 'Fan' || this.source.type === 'Artist') &&
                this.target.type === 'Voucher' &&
                this.paymentType === 'chained') {
                return true;
            }

            if (this.source.type === 'Voucher' &&
                this.target.type === 'Vote' &&
                this.paymentType === 'preapproved') {
                return true;
            }

            if (this.source.type === 'Trustee' &&
                this.target.type === 'Artist' &&
                this.paymentType === 'preapproved') {
                return true;
            }

            if (this.paymentType == 'mobile') {
                return true;
            }
            return false;
        }

    },
    // Fees automatically taken by PP, here we define the amount ignoring the fees
    shares: {
        // -1 if doing preapproved payment gr -> atrist
        gr: {
            type: Number,
            required: true
        },
        // -1 if doing a simple payment fan -> gr
        artist: {
            type: Number,
            required: true
        }
    },
    currency: {
        type: String,
        enum: _.map(currencies, function (c) {
            return c.code;
        }),
        required: true,
        default: 'USD'
    },
    state: {
        type: String,
        enum: ['created', 'completed', 'aborted', 'commit-abort-pending'],
        required: true,
        default: 'created',
        index: true,
        validate: function validateState(value) {
            if ((this.state === 'completed' || this.state === 'aborted') && !this.completed) {
                return false;
            }

            return true;
        }
    },
    completed: {
        type: Date,
        index: true
    },
    contest: {
        type: Schema.Types.ObjectId
    },
    userdata: Schema.Types.Mixed,
    paymentFlow: [Schema.Types.Mixed],

    // Indicate that all of the payment's money is on GR's account.
    //
    // For those payments the artist shares need to be explicitly transfered to the
    // artists account and the payment must be marked as transfered!
    //
    // only used by desktop payments
    usedGRCollectiveAddress: {
        type: Boolean,
        default: false
    },

    // Only set to true after the payment has been transeferd explicitly to the artist!
    transfered: {
        type: Boolean,
        default: false
    },
    // Id of the payment used to finally transfer the paymnet
    transferPayment: {
        type: Schema.Types.ObjectId,
        ref: 'Payment'
    },

    // if !== 'desktop' payment was done using the mobile platform
    //
    // As mobile payments are done via AppStore & Co. the complete amount
    // is initially transfered to GR's account.
    //
    // For all mobile payments the artist shares need to be explicitly transfered to the
    // artists account and the payment must be marked as transfered!
    platform: {
        type: String,
        enum: ['android', 'ios', 'desktop'],
        required: true,
        index: true,
        default: 'desktop'
    }
});

/**
 * @name Model:Payment.PaymentSchema-pre
 * @function
 * @param {Object} next function name
 * @functiondesc: checks target object type is voucher before save
 * @callback next function called after checking type
 */
PaymentSchema.pre('validate', function (next) {
    if (this.target.type === 'Voucher') {
        return next();
    }

    if (!this.target.artist) {
        this.invalidate('target.artist', 'Path `target.artist` is required');
    }

    next();
});

/**
 * @name Model:Payment.PaymentSchema-virtual
 * @function
 * @param {String} Paypal account
 * @returns {String} paypal account after
 */
PaymentSchema.virtual('payPalAccount').get(function () {
    if (this.amount <= config.payment.maxMicroPayment[this.currency]) {
        console.log("Using microPaymentAccount for Payment: " + this._id);
        return config.payPal.microPaymentAccount;
    }

    console.log("Using defaultAccount for Payment: " + this._id);
    return config.payPal.defaultAccount;
});

PaymentSchema.statics.createListeners = [];
PaymentSchema.statics.commitListeners = [];
PaymentSchema.statics.abortListeners = [];

PaymentSchema.statics.validAmount = function (amount, currency) {
    var c = _.find(currencies, function (c) {
        return c.code === currency;
    });

    console.log(JSON.stringify(c, null, 2));

    if (c && c.options && c.options === 'nodecimal') {
        console.log("Round i will!");
        amount = Math.round(amount);
    } else {
        amount = Math.round(amount * 100) / 100;
    }
    return amount;
};

PaymentSchema.statics.getExchangeRate = function (currency) {
    var dfd = Q.defer();
    ExchangeRate.current()
        .then(function (rate) {
            return dfd.resolve(rate.rates[currency]);
        })
        .fail(function (err) {
            console.error(err);
            dfd.reject(err);
        });

    return dfd.promise;
};

PaymentSchema.statics.getVotePrice = function (currency) {
    var dollarShares = config.payment.paidVotePrice.USD;
    var shares = config.payment.paidVotePrice[currency];

    return {
        dollarShares: dollarShares,
        shares: shares
    };
};

PaymentSchema.statics.checkForeignCurrency = function (artistId, targetType, data) {
    var dfd = Q.defer();
    var Payment = mongoose.model('Payment');
    Q.ninvoke(mongoose.model('Artist').findOne({
        _id: artistId
    }), 'exec')
        .then(function (_artist) {
            var targetCurrency = _artist.paypal_currency;
            if (targetCurrency === 'USD') {
                return dfd.resolve({
                    needForeignCurrency: false
                });
            }

            var dollarAmount;
            var paymentAmount;
            var fixedPrice = false;
            // Vote prices are fixed using config
            if (targetType === 'vote') {
                var price = mongoose.model('Payment').getVotePrice(targetCurrency);
                var dollarShares = price.dollarShares;
                var shares = price.shares;
                paymentAmount = Math.round((shares.artist + shares.gr) * 100) / 100;
                dollarAmount = Math.round((dollarShares.artist + dollarShares.gr) * 100) / 100;
                fixedPrice = true;
                return dfd.resolve({
                    needForeignCurrency: true,
                    fixedPrice: fixedPrice,
                    currency: targetCurrency,
                    dollarAmount: dollarAmount,
                    paymentAmount: paymentAmount
                });
            } else if (targetType === 'voucher') {
                var packageId = data;
                Q.ninvoke(mongoose.model('VoucherTemplate').findOne({
                    _id: packageId
                }), 'exec')
                    .then(function (voucher) {
                        paymentAmount = voucher.amount[targetCurrency];
                        dollarAmount = voucher.amount.USD;
                        return dfd.resolve({
                            needForeignCurrency: true,
                            fixedPrice: fixedPrice,
                            currency: targetCurrency,
                            dollarAmount: dollarAmount,
                            paymentAmount: paymentAmount
                        });
                    })
                    .fail(function (err) {
                        console.error(err);
                        console.error(err.stack);
                        dfd.reject(err);
                    });
            } else if (targetType === 'project') {
                dollarAmount = data;
                mongoose.model('Payment').getExchangeRate(targetCurrency)
                    .then(function (exchRate) {
                        paymentAmount = Math.round((data * exchRate) * 100) / 100;
                        paymentAmount = Payment.validAmount(paymentAmount, targetCurrency);

                        return dfd.resolve({
                            needForeignCurrency: true,
                            fixedPrice: fixedPrice,
                            currency: targetCurrency,
                            exchangeRate: exchRate,
                            dollarAmount: dollarAmount,
                            paymentAmount: paymentAmount
                        });
                    });
            } else {
                return dfd.reject(new Error('Unknow targetType: ' + targetType));
            }
        })
        .fail(function (err) {
            console.error(err);
            console.error(err.stack);
            dfd.reject(err);
        });

    return dfd.promise;
};

PaymentSchema.statics.createPayment = function (sourceType, sourceId, targetType, targetId, amount, userdata, dollarAmount, exchangeRate) {
    var dfd = Q.defer();
    var Payment = mongoose.model('Payment');
    var payment = new this();
    var sourceModel;
    if (sourceType.toLowerCase() === 'fan') {
        payment.source.type = 'Fan';
        payment.source.fan = sourceId;
        sourceModel = mongoose.model('Fan');
    }
    if (sourceType.toLowerCase() === 'artist') {
        payment.source.type = 'Artist';
        payment.source.artist = sourceId;
        sourceModel = mongoose.model('Artist');
    }

    if (sourceType.toLowerCase() === 'voucher') {
        payment.source.type = 'Voucher';
        payment.source.voucher = sourceId;
        sourceModel = mongoose.model('Voucher');
    }

    var targetModel;
    if (targetType.toLowerCase() === 'project') {
        payment.target.type = 'Project';
        payment.target.project = targetId;
        targetModel = mongoose.model('Project');
    }

    if (targetType.toLowerCase() === 'vote') {
        payment.target.type = 'Vote';
        payment.target.vote = targetId;
        targetModel = mongoose.model('Vote');
    }

    if (targetType.toLowerCase() === 'voucher') {
        payment.target.type = 'Voucher';
        payment.target.voucher = targetId;
        targetModel = mongoose.model('Voucher');
    }

    // Set Payment type
    if ((payment.source.type === 'Artist' || payment.source.type === 'Fan') &&
        (payment.target.type === 'Project' || payment.target.type === 'Vote' || payment.target.type === 'Voucher')) {
        payment.paymentType = 'chained';
    }

    if (userdata && userdata.contestId) {
        payment.contest = userdata.contestId;
        delete(userdata.contestId);
    }

    payment.userdata = userdata;

    Q.all(_.map(this.createListeners, function (lsnr) {
        return lsnr.handler(sourceType, sourceId, targetType, targetId, amount);
    }))
        .then(function () {
            var tasks = [];
            tasks.push(Q.ninvoke(sourceModel.findOne({
                _id: sourceId
            }), 'exec'));
            tasks.push(Q.ninvoke(targetModel.findOne({
                _id: targetId
            })
                .populate('artist', 'currency paypal_currency paypal_email email'), 'exec'));

            return Q.all(tasks);
        })
        .spread(function (payer, target) {
            // Set default value. Only required for project payments
            payment.dollarAmount = -1;

            if (target.artist) {
                payment.currency = target.artist.paypal_currency;
                payment.target.artist = target.artist._id;
                if (!target.artist.paypal_email || !target.artist.paypal_currency) {
                    dfd.reject('Cannot create artist payment without a paypal_email address or missing paypal_currency!');
                }
            }

            // Set Shares
            if ((payment.source.type === 'Artist' || payment.source.type === 'Fan') &&
                payment.target.type === 'Vote') {
                var price = mongoose.model('Payment').getVotePrice(target.artist.paypal_currency);
                payment.shares = price.shares;
                //payment.amount = twoCommas(payment.shares.gr + payment.shares.artist);
            }

            if ((payment.source.type === 'Artist' || payment.source.type === 'Fan') &&
                payment.target.type === 'Project') {
                if (!dollarAmount) {
                    dfd.reject(new Error('Cannot create project payment without explicit dollarAmount'));
                }
                payment.dollarAmount = dollarAmount;
                if (!exchangeRate) {
                    dfd.reject(new Error('Cannot create project payment without explicit exchangeRate'));
                }
                //payment.currency = target.currency;
                payment.exchangeRate = exchangeRate;
                payment.shares.gr = parseFloat((amount * config.payment.projectFee).toFixed(2));
                payment.shares.artist = twoCommas(amount - payment.shares.gr);
                //payment.amount = twoCommas(payment.shares.gr + payment.shares.artist);
            }

            if ((payment.source.type === 'Artist' || payment.source.type === 'Fan') &&
                payment.target.type === 'Voucher') {
                payment.shares.gr = twoCommas(amount * config.payment.voucherFee);
                payment.shares.artist = twoCommas(amount - payment.shares.gr);
                //payment.amount = twoCommas(amount);
            }

            payment.shares.artist = Payment.validAmount(payment.shares.artist, payment.currency);
            payment.shares.gr = Payment.validAmount(payment.shares.gr, payment.currency);
            payment.amount = Payment.validAmount(payment.shares.gr + payment.shares.artist, payment.currency);

            return Q.ninvoke(payment, 'save');
        })
        .then(function () {
            dfd.resolve(payment);
        })
        .fail(function (err) {
            console.error(err);
            console.error(err.stack);
            dfd.reject(err);
        });

    return dfd.promise;
};

PaymentSchema.methods.commit = function () {
    return mongoose.model('Payment').commit(this._id);
};

PaymentSchema.statics.commit = function (paymentId) {
    var dfd = Q.defer();
    var self = this;
    var model = mongoose.model('Payment');
    Q.ninvoke(model.findOne({
        _id: paymentId
    }), 'exec')
        .then(function (pmt) {
            return Q.ninvoke(model.findOneAndUpdate({
                    $and: [{
                        _id: paymentId
                    }, {
                        $or: [{
                            state: 'created'
                        }, {
                            state: 'aborted'
                        }, {
                            state: 'commit-abort-pending'
                        }]
                    }]
                }, {
                    state: 'completed',
                    transfered: !pmt.usedGRCollectiveAddress,
                    completed: new Date()
                }),
                'exec');
        })
        .then(function (updated) {
            if (updated) {
                var lsnrPs = _.map(self.commitListeners, function (lsnr) {
                    return lsnr.handler(updated);
                });
                Q.all(lsnrPs)
                    .then(function () {
                        dfd.resolve(updated);
                    })
                    .fail(function (err) {
                        dfd.reject(err);
                    });

            } else {
                dfd.reject('Commit of payment: ' + paymentId + ' failed!');
            }
        })
        .fail(function (err) {
            dfd.reject(err);
            console.error(err);
        });

    return dfd.promise;
};

PaymentSchema.methods.abort = function () {
    return mongoose.model('Payment').abort(this._id);
};

PaymentSchema.statics.abort = function (paymentId, data) {
    var self = this;
    var dfd = Q.defer();

    var update = {
        state: 'aborted',
        completed: new Date()
    };

    if (data) {
        update.$push = {
            paymentFlow: data
        };
    }

    Q.ninvoke(mongoose.model('Payment').findOneAndUpdate({
            $and: [{
                _id: paymentId
            }, {
                $or: [{
                    state: 'created'
                }, {
                    state: 'commit-abort-pending'
                }]
            }]
        }, update),
        'exec')
        .then(function (updated) {
            if (updated) {
                // dfd.resolve(updated);

                var lsnrPs = _.map(self.abortListeners, function (lsnr) {
                    return lsnr.handler(updated);
                });
                Q.all(lsnrPs)
                    .then(function () {
                        dfd.resolve(updated);
                    })
                    .fail(function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.reject('Abort of payment: ' + paymentId + ' failed!');
            }

        })
        .fail(function (err) {
            console.error(err);
            dfd.reject(err);
        });

    return dfd.promise;
};

PaymentSchema.statics.lockForCommit = function (paymentId) {
    var dfd = Q.defer();

    Q.ninvoke(mongoose.model('Payment').findOneAndUpdate({
            $and: [{
                _id: paymentId
            }, {
                state: {
                    $in: ['created', 'aborted']
                }
            }]
        }, {
            state: 'commit-abort-pending'
        }),
        'exec')
        .then(function (updated) {
            //console.log('Found paymnet: ');
            //console.log(JSON.stringify(updated, null, 2));
            if (updated) {
                dfd.resolve(updated);
            } else {
                dfd.reject('Cannot lock Payment: ' + paymentId + '!');
            }
        })
        .fail(function (err) {
            console.error(err);
            dfd.reject(err);
        });

    return dfd.promise;
};

PaymentSchema.statics.setUsedGRCollectiveAddress = function (paymentId, onOff) {
    var dfd = Q.defer();
    Q.ninvoke(mongoose.model('Payment').findOneAndUpdate({
        $and: [{
            _id: paymentId
        }, {
            state: 'created'
        }]
    }, {
        usedGRCollectiveAddress: onOff
    }), 'exec')
        .then(function (pmt) {
            if (!pmt) {
                return dfd.reject('Payment: ' + paymentId + ' does not exist or nort in created state!');
            }
            dfd.resolve(pmt);
        })
        .fail(function (err) {
            dfd.reject(err);
            console.error(err);
        });

    return dfd.promise;
};

PaymentSchema.statics.getById = function (paymentId, ignoreState) {
    var dfd = Q.defer();
    var query = {
        $and: [{
            _id: paymentId
        }]
    };
    if (!ignoreState) {
        query.$and.push({
            state: 'created'
        });
    }

    Q.ninvoke(mongoose.model('Payment').findOne(query)
        .populate('target.artist', 'contact.first_name contact.last_name paypal_email paypal_verified email contact.country slug'), 'exec')
        .then(function (pmt) {
            if (!pmt) {
                return dfd.reject('Payment: ' + paymentId + ' does not exist!');
            }
            if (!pmt.target.artist.paypal_email) {
                return dfd.reject('Payment: ' + paymentId + ' does not reference artist with paypal_email!');
            }
            console.log("GetById returns =>");
            console.log(JSON.stringify(pmt, null, 2));
            dfd.resolve(pmt);
        })
        .fail(function (err) {
            dfd.reject(err);
            console.error(err);
        });
    return dfd.promise;
};

PaymentSchema.statics.pushFlowData = function (paymentId, data) {
    var dfd = Q.defer();
    Q.ninvoke(mongoose.model('Payment').findOneAndUpdate({
        _id: paymentId
    }, {
        $push: {
            paymentFlow: data
        }
    }), 'exec')
        .then(function (pmt) {
            if (!pmt) {
                return dfd.reject('Payment: ' + paymentId + ' does not exist or nort in created state!');
            }
            dfd.resolve(pmt);
        })
        .fail(function (err) {
            dfd.reject(err);
            console.error(err);
        });
    return dfd.promise;
};

PaymentSchema.statics.listArtistPayments = function (artistId, paginator) {
    var Payment = mongoose.model('Payment');
    var page;
    var pageSize;

    var findQ = {
        $and: [{
            'target.artist': artistId
        }, {
            'state': 'completed'
        }, {
            'source.type': {
                $ne: 'Trustee'
            }
        }]
    };
    var mCount = mongoose.model('Payment').count(findQ);
    var mQuery = mongoose.model('Payment').find(findQ).sort({
        completed: -1
    }).select('-paymentFlow -userdata');

    console.log("Pagination => ");
    console.dir(paginator);

    if (paginator) {
        page = paginator.page || 0;
        pageSize = paginator.pageSize || 50;
        mQuery = mQuery.skip(page * pageSize).limit(pageSize);
    }

    var sum = {};
    var count;
    return Q.all([
        Q.ninvoke(mQuery, 'exec'),
        Q.ninvoke(mCount, 'exec')
    ]).spread(function (result, _count) {
        count = _count;
        var ps = [];
        var gpd = _.chain(result).groupBy('currency').each(function (item, key) {
            sum[key] = _.reduce(item, function (s, it) {
                return s + parseFloat(it.amount);
            }, 0);
        });

        _.each(result, function (item) {
            ps.push(Q.ninvoke(item, 'populate', 'target.project target.voucher target.vote'));
        });

        return Q.all(ps);
    }).then(function (populated) {
        var ps = [];
        _.each(populated, function (p) {
            var pPlain = p.toObject();
            pPlain.transferState = Payment.getTransferState(p);
            ps.push(pPlain);
        });

        return {
            payments: ps,
            sum: sum,
            itemCount: count,
            pages: Math.ceil((count / pageSize))
        };
    });
};

PaymentSchema.plugin(timestamps, {
    index: true
});

PaymentSchema.plugin(projectPlugin);
PaymentSchema.plugin(voucherPlugin);
PaymentSchema.plugin(votePlugin);
PaymentSchema.plugin(transferPlugin);

module.exports = mongoose.model('Payment', PaymentSchema);
