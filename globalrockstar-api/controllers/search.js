'use strict';
/**
 *@module Controller:Search
 *@description this modulle is used for search songs activities
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:Artist
 *@requires module:Song
 *@requires module:lodash
 *@requires module:hapi
 *@requires module:q
 **/
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var Song = mongoose.model('Song');
var _ = require('lodash');
var Hapi = require('hapi');
var Q = require('q');

module.exports = {
    /**
     * @name Controller:Search.search
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for fetching the active songs from Song model
     * @returns {object} songs data
     **/
    search: function (req, reply) {
        var q = req.query.q;
        if (!q || q === '') {
            return reply(Hapi.error.notFound());
        }

        if (q.length < 3) {
            return reply(Hapi.error.badRequest('required query length > 3 characters'));
        }

        q = new RegExp(RegExp.quote(q), 'i');

        var artistQuery = {
            $or: [
                {name: q}
            ]
        };
        //Populating the query
        var songQuery = {
            state: 'active',
            $or: [
                {title: q}/*,
                 { description: q },
                 { lyrics: q }*/
            ]
        };


        var page = req.pre.paginator.page;
        var pageSize = req.pre.paginator.pagesize;

        Q.all([
            Artist.find(artistQuery, '_id').exec(),
            Song.find(songQuery, '_id').exec()
        ]).then(function (data) {

            var artistIds = _.pluck(data[0], '_id');
            var songIds = _.pluck(data[1], '_id');

            var query = {state: 'active', $or: [{artist: {$in: artistIds}}, {_id: {$in: songIds}}]};

            return Q.all([
                Song.count(query).exec(),
                Song.find(query, 'title state artist slug plays youtube')
                    .populate('artist', '_id slug name country')
                    .sort("-contest order -createdAt")
                    .skip(pageSize * page)
                    .limit(pageSize)
                    .exec()
            ]);

        }).then(function (songData) {
            reply({
                pages: Math.ceil((songData[0] / pageSize) * 10) / 10,
                songs: songData[1]
            });
        }).fail(function (err) {
            console.dir(err);
            reply(err);
        });

    }
};
