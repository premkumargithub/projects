'use strict';
/**
 *   @module Model:Payment-Voucher
 *   @description This module is used for providing schema services to voucher model
 *   @requires module:q
 *   @requires module:mongoose
 *   @requires module:mongoose-timestamps
 *   @requires module:lodash
 *   @requires module:node-redis-pubsub
 *   @requires module:../config
 **/
var Q = require('q');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamps');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('lodash');

var nrp = require('node-redis-pubsub');
var config = require('../config');
var unagi = new nrp(config.redis);

module.exports = function (schema) {

    function createListener(sourceType, sourceId, targetType, targetId, amount) {
        if (targetType !== 'Voucher') {
            return new Q();
        }

        var dfd = Q.defer();

        Q.ninvoke(mongoose.model('Voucher').findOne({
            _id: targetId
        }), 'exec')
            .then(function (voucher) {
                if (!voucher) {
                    return dfd.reject(new Error('No mathcing voucher found by id: ' + targetId));
                }

                dfd.resolve();
            });

        return dfd.promise;
    }

    function commitListener(payment) {
        var voucher;
        if (payment.target.type !== 'Voucher') {
            return new Q();
        }

        return Q.ninvoke(mongoose.model('Voucher').findOne({
            _id: payment.target.voucher
        }), 'exec').then(function (_voucher) {
            voucher = _voucher;
            voucher.status = 'processed';
            return Q.ninvoke(voucher, 'save');
        }).then(function () {
            unagi.emit('voucher:completed', {
                voucher: voucher
            });
            return Q.resolve();
        }).fail(function (err) {
            return Q.reject(err);
        });
    }

    schema.statics.createListeners.push({
        name: 'VoucherCreateListener',
        handler: createListener
    });

    schema.statics.commitListeners.push({
        name: 'VoucherCommitListener',
        handler: commitListener
    });

    // Setup indices
    schema.index({
        'source.type': 1,
        'source.fan': 1,
        'target.artist': 1,
        'target.type': 1,
        'target.voucher': 1,
        'amount': 1,
        'completed': 1,
        'currency': 1
    });
};
