'use strict';
/** 
*@module Event:Votes
*@description this modulle is used for providing the service to votes related events
*Required modules are defined here
*@requires module:mongoose
*@requires module:Artist
*@requires module:Fan
*@requires module:ChartEntry
*@requires module:Song
*@requires module:lodash
*@requires module:Badge
*@requires module:MediaLibrary
*@requires module:VotingPackage
*@requires module:q
*@requires module:../lib/get-current-contest
*@requires module:../lib/get-current-chartentries
**/
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var Fan = mongoose.model('Fan');
var ChartEntry = mongoose.model('ChartEntry');
var Song = mongoose.model('Song');
var _ = require('lodash');
var Badge = mongoose.model('Badge');
var MediaLibrary = mongoose.model('MediaLibrary');
var VotingPackage = mongoose.model('VotingPackage');
var Q = require('q');
var currentContest = require('../lib/get-current-contest');
var currentChartEntries = require('../lib/get-current-chartentries');

/**
* This is a description of logError function.
* @function 
* @name Event:Votes.logError
* @param {object}  error Error object
* @description It checks either the error is duplicate or not
*/
var logError = function (err) {
    //checking for duplicate error and print to console 
    if (err && err.err.indexOf('duplicate') === -1) console.error(err);
};

module.exports = function (unagi) {
    /**
    * @name Event:Votes.unagi-process:songs:votes:created:activity
    * @event
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to prepare the models fiels for fans and artists 
    **/
    unagi.process('songs:votes:created:activity', function (job, done) {
        var vote_data = job.data;
        var Model = vote_data.fanType == 'artists' ? Artist : Fan;
        var modelFields = vote_data.fanType == 'artists' ? {
            slug: 1,
            name: 1,
            picture: 1
        } : {
            slug: 1,
            firstname: 1,
            lastname: 1,
            picture: 1
        };
        return Q.all([
            Q.ninvoke(Model, 'findOne', {
                _id: vote_data.fanId
            }, modelFields),
            Q.ninvoke(Artist, 'findOne', {
                _id: vote_data.artistId
            }, {
                slug: 1,
                name: 1,
                picture: 1
            }),
            Q.ninvoke(Song, 'findOne', {
                _id: vote_data.songId
            }, {
                slug: 1,
                title: 1,
                youtube: 1
            })
        ]).spread(function (artist, user, song) {

            vote_data.song_slug = song.slug;
            vote_data.song_title = song.title;
            vote_data.song_youtubeId = song.youtube ? song.youtube.id : null;

            vote_data.artist_slug = user.slug;
            vote_data.artist_name = user.name;
            vote_data.artist_picture = user.picture;

            vote_data.voter_slug = artist.slug;
            vote_data.voter_name = vote_data.fanType == 'artists' ? artist.name : artist.firstname + " " + artist.lastname;
            vote_data.voter_picture = artist.picture;

            unagi.fire('activities:songs:votes:created', vote_data);
            console.log('activities:songs:votes:created:done');
            done();
        }).fail(function (err) {
            done(err);
        });
    });
    /**
    * @name Event:Votes.unagi-process:songs:votes:created
    * @event
    * @param {object} job - Request object
    * @param {Requester~requestCallback} done - The callback that handles the response.
    * @callback Requester~requestCallback: done
    * @description Used to prepare the models fiels for fans and artists 
    **/
    unagi.process('songs:votes:created', function (job, done) {
        var vote_data = job.data;

        if (vote_data.state != 'processed') {
            return done();
        }

        var currentPhase = null;

        currentContest().then(function (contest) {
            if (!contest) {
                console.warn('No contest found');
                return done();
            }

            currentPhase = contest.currentPhase[contest.currentPhase.length - 1];

            var finder = ChartEntry.findOne({
                contest: contest._id,
                song: vote_data.songId,
                phase: currentPhase
            });

            return Q.ninvoke(finder, 'exec');
        }).then(function (entry) {
            entry.votes += 1;
            entry.voteRefs = entry.voteRefs || [];
            entry.voteRefs.push(vote_data.vote);
            return Q.ninvoke(entry, 'save');
        }).then(function (entry) {
            unagi.fire('charts:update', {
                phase: currentPhase,
                country: entry[0].country
            });
            done();
        }).fail(function (err) {
            console.log(err);
            done(err);
        });
    });


    unagi.process('charts:update', function (job, done) {
        // console.log("[perf] charts:update")
        var phase = job.data.phase;
        var isNP = phase === 'np';

        currentChartEntries(0, '_id votes pos nPos phase country', phase || true, null, true)
            .then(function (chartEntries) {

                _.map(chartEntries, function (entry, i) {
                    
                    var pos = entry.pos ;
                    var nPos = entry.nPos ;

                    this.np[entry.country] = this.np[entry.country] || {
                        invC: 0,
                        prevV: -1,
                        posC: 1
                    };

                    if (entry.votes == this.prevV) {
                        this.invC += 1;
                    } else {
                        this.posC += this.invC;
                        this.invC = 1;
                    }

                    if (entry.votes == this.np[entry.country].prevV) {
                        this.np[entry.country].invC += 1;
                    } else {
                        this.np[entry.country].posC += this.np[entry.country].invC;
                        this.np[entry.country].invC = 1;
                    }

                    entry.pos = this.posC;
                    this.prevV = entry.votes;

                    if (isNP) {
                        entry.nPos = this.np[entry.country].posC;
                        this.np[entry.country].prevV = entry.votes;
                    }

                    if (entry.pos != pos || entry.nPos != nPos) {
                        entry.save(function (err, res) {
                            if (err) console.log(err);
                        });
                    }

                }, {
                    prevV: -1,
                    invC: 0,
                    posC: 1,
                    np: {}
                });

                done();

            }).fail(function (err) {
                console.log(err);
                console.log(err.stack);
                done(err);
            });
    });

    unagi.process('songs:votes:serie', function (job, done) {
        console.log('songs:votes:serie:processing');
        var vote_data = job.data;
        currentContest().then(function (contest) {
            if (!contest) {
                console.warn('No contest found');
                return done();
            }

            (new Badge({
                userId: vote_data.artist,
                userType: 'artist',
                contest: contest._id,
                type: 'votingserie'
            })).save(logError);

            (new Badge({
                userId: vote_data.voter,
                userType: vote_data.voter_type,
                contest: contest._id,
                type: 'votingserie-voted'
            })).save(logError);

            var Model = vote_data.voter_type == 'artist' ? Artist : Fan;

            return Q.all([
                Q.ninvoke(Model, 'findOne', {
                    _id: vote_data.voter
                }, {
                    slug: 1
                }),
                Q.ninvoke(Artist, 'findOne', {
                    _id: vote_data.artist
                }, {
                    slug: 1
                }),
                Q.ninvoke(Song, 'findOne', {
                    _id: vote_data.song
                }, {
                    slug: 1
                })
            ]).spread(function (artist, user, song) {
                vote_data.artist_slug = artist.slug;
                vote_data.voter_slug = user.slug;
                vote_data.song_slug = song.slug;
                unagi.fire('activities:songs:votes:serie', vote_data);
                console.log('songs:votes:serie:done');
                done();
            }).fail(function (err) {
                console.error(err);
                done(err);
            });
        }).fail(function (err) {
            console.error(err);
            done(err);
        });
    });

    unagi.process('votes:new-purchase', function (job, done) {
        var data = job.data;
        var songId = data.song;

        Q.ninvoke(VotingPackage, 'findOne', {
            artist: data.artist,
            contest: data.contest,
            song: {
                $exists: true
            }
        }).then(function (songReward) {
            if (songReward) {
                data.song = songReward.song;
            }

            return Q.ninvoke(Song, 'findById', data.song);
        }).then(function (song) {
            if (song._doc.state != 'active') {
                data.song = songId;
            }

            return Q.ninvoke(MediaLibrary, 'update', {
                userId: data.userId,
                userType: data.userType
            }, {
                $addToSet: {
                    songs: data.song
                }
            }, {
                upsert: true
            });
        }).then(function () {
            console.log('media-library:%s:add-song:%s', data.userId, data.song);
            done();
        }).fail(function (err) {
            console.error(err);
            console.error(err.stack);
            done(err);
        });
    });
};
