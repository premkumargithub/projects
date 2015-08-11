'use strict';
/**
 *@module Contoller:Votking-Packages
 *@description this modulle is used for voting packages activities
 *Required modules are defined here
 *@requires module:hapi
 *@requires module:../lib/mongoose-hapi-errors
 *@requires module:q
 *@requires module:../models/voting-package
 *@requires module:../models/voucher-template
 **/
var Hapi = require('hapi');
var reformatErrors = require('../lib/mongoose-hapi-errors');
var Q = require('q');
var VotingPackage = require('../models/voting-package');
var VoucherTemplate = require('../models/voucher-template');

/**
 * @function Contoller:Votking-Packages.func
 * @param {String} name Voting package name
 * @description This is used for adding two values
 * @returns {String}
 */
var func = function (name) {
    return function (obj) {
        return obj[name]();
    };
};

/** @namespace */
var success = {
    /**
     * Refer to this by {@link success."status"}.
     * @namespace
     */
    status: 'success'
};

/**
 * @function Contoller:Votking-Packages.zip
 * @param {object} templates object
 * @param {object} packages object
 * @description This is used for adding two values
 * @returns {integer}
 */
function zip(templates, packages) {
    return templates.map(function (t) {
        t.package = packages.filter(function (p) {
            return p.template && p.template.toString() == t._id.toString();
        })[0];
        return t;
    }).sort(function (a, b) {
        return a.votes > b.votes ? 1 : -1;
    });
}

module.exports = {
    /**
     * @name Contoller:Votking-Packages.indexContest
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     **/
    indexContest: function (req, reply) {
        Q.all([
            Q.ninvoke(VoucherTemplate, 'find'),
            Q.ninvoke(VotingPackage.find({
                artist: req.params.artistId,
                contest: req.params.contestId
            }), 'exec')
        ]).spread(function (templates, votingPackages) {
            reply(zip(templates.map(func('toObject')), votingPackages));
        }).fail(function (err) {
            console.error(err);
            reply(err);
        });
    },
    /**
     * @name Contoller:Votking-Packages.indexContest
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @returns {object} success OR error
     **/
    index: function (req, reply) {
        Q.ninvoke(VotingPackage, 'find', {
            artist: req.params.artistId
        }).then(function (votingPackages) {
            reply(votingPackages);
        }).fail(function (err) {
            console.error(err);
            reply(err);
        });
    },
    /**
     * @name Contoller:Votking-Packages.create
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @returns {object} success OR error
     **/
    create: function (req, reply) {
        var votingPackage = new VotingPackage();

        if (req.pre.template) {
            votingPackage.template = req.pre.template._id;
            votingPackage.reward = req.pre.template.rewards.id(req.payload.reward);
        } else {
            votingPackage.song = req.payload.reward;
        }

        votingPackage.contest = req.payload.contest;
        votingPackage.artist = req.params.artistId;
        Q.ninvoke(votingPackage, 'save').then(function () {
            reply({_id: votingPackage._id});
        }).fail(function (err) {
            return reply(reformatErrors(err));
        });
    },
    /**
     * @name Contoller:Votking-Packages.update
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @returns {object} success OR error
     **/
    update: function (req, reply) {
        var votingPackage;
        Q.ninvoke(VotingPackage, 'findOne', {
            artist: req.params.artistId,
            _id: req.params.id
        }).then(function (_votingPackage) {
            votingPackage = _votingPackage;
            return Q.ninvoke(VoucherTemplate, 'findById', votingPackage.template);
        }).then(function (template) {
            console.dir(req.payload);
            var reward = template.rewards.id(req.payload.reward);
            console.dir(reward);
            if (reward) {
                votingPackage.reward = reward._id;
            }
            console.dir(votingPackage);
            return Q.ninvoke(votingPackage, 'save');
        }).then(function () {
            reply(success);
        }).fail(function (err) {
            console.error(err);
            reply(err);
        });
    },
    /**
     * @name Contoller:Votking-Packages.delete
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @returns {object} success OR error
     **/
    delete: function (req, reply) {
        Q.ninvoke(VotingPackage, 'findOne', {
            artist: req.params.artistId,
            _id: req.params.id
        }).then(function (votingPackage) {
            return Q.ninvoke(votingPackage, 'remove');
        }).then(function () {
            reply(success);
        }).fail(function (err) {
            console.error(err);
            reply(err);
        });
    }
};
