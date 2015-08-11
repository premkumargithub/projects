'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    Voucher = mongoose.model('Voucher'),
    _ = require('lodash');

function voucherFactory(userId, userType) {
    return new Voucher({
        _id: ObjectId(),
        user: {
            id: userId,
            role: userType
        },
        title: 'Test',
        amount: {
            EUR: 42,
            USD: 64,
        },
        votes: 84,
        template: ObjectId()
    });
}

function validVoucher(userId, userType) {
    return new Q(voucherFactory(userId, userType));
}

function savedVoucher(userId, userType, cb) {
    var voucher;
    return validVoucher(userId, userType)
        .then(function (a) {
            voucher = a;
            return Q.ninvoke(voucher, 'save');
        })
        .then(function (v) {
            return Q.ninvoke(Voucher.findOne({
                _id: voucher._id
            }), 'exec');
        }).fail(function(err) {
            console.error(err);
        })
        .nodeify(cb);
}

module.exports = {
    validVoucher: validVoucher,
    savedVoucher: savedVoucher
};
