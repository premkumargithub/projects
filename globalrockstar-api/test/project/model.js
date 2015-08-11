/* globals describe, it, before, after, beforeEach, afterEach */
'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    dbUtil = require('../util/db'),
    mongoose = require('mongoose'),
    Project = mongoose.model('Project'),
    Artist = mongoose.model('Artist'),
    Song = mongoose.model('Song'),
    chai = require('chai'),
    expect = chai.expect;

var ObjectId = mongoose.Types.ObjectId;
var project, artist, artist2, song;

function projectFactory(title) {
    return new Project({
        _id: ObjectId(),
        category: 'Album',
        title: title ? title : 'some title ' + ObjectId(),
        teaserImage: 'some/crazy/path',
        moneyToRaise: 12000,
        currency: 'USD',
        defaultReward: new ObjectId(),
        rewards: ['Free song', 'Free Download', 'CD', 'CD plus T-Shirt', 'New Car!']
    });
}

function artistFactory() {
    return new Artist({
        _id: ObjectId(),
        provider: 'local',
        name: 'Test Artist',
        email: ObjectId().toString() + 'projecttest@test.com',
        password: 'hrhk@1234',
        password_confirmation: 'hrhk@1234',
        toc: true,
        newsletter: true,
        country: 'IN',
        paypal_email: ObjectId().toString() + 'projecttest@test.com',
        paypal_currency: 'USD'
    });
}

var removeUser = function (id) {
    Artist.remove({_id: id}, function () {
        return;
    });
};

var removeProject = function (id) {
    Project.remove({_id: id}, function () {
        return;
    });
};

describe('Projects Model tests:', function () {
    it('save() - sets the project\'s correct default values', function (done) {
        project = projectFactory();
        project.save(function (err, p) {
            Project.find({_id: project._id}, function (err, c) {
                c.length.should.equal(1);
                c[0].state.should.equal('created');
                c[0].currency.should.equal('USD');

                done();
            });
        });
    });

    it('save() - generates the slug for a project to an artist', function (done) {
        artist = artistFactory();
        artist.save(function (err, s) {
            project.artist = s._id;
            project.title = 'test projekt';
            project.save(function (err, p) {
                Project.find({ _id: project._id }, function (err, c) {
                    c.length.should.equal(1);
                    c[0].slug.should.equal(s.slug + "-test-projekt");

                    done();
                });
            });
        })
    });

    it('save() - generates unique slug for project with same title and artist', function (done) {
        var proj2 = projectFactory();
        project.artist = artist._id;
        project.title = 'test projekt';
        project.save(function (err, p) {
            Project.find({ _id: project._id }, function (err, c) {
                c.length.should.equal(1);
                c[0].slug.should.equal(artist.slug + "-test-projekt");

                proj2.artist = artist._id;
                proj2.title = 'test projekt';
                proj2.save(function (err, s) {
                    s.slug.should.equal(artist.slug + "-test-projekt-2");

                    removeProject(proj2._id);
                    done();
                });

            });
        });
    });

    it('save() - generates unique slug for project with same title but different artist', function (done) {
        var proj2 = projectFactory();
        project.artist = artist._id;
        project.title = 'test projekt';
        project.save(function (err, p) {
            Project.find({ _id: project._id }, function (err, c) {
                c.length.should.equal(1);
                c[0].slug.should.equal(artist.slug + "-test-projekt");

                artist2 = artistFactory();
                artist2.save(function (err, a2) {
                    proj2.artist = a2._id;
                    proj2.title = 'test projekt';
                    proj2.save(function (err, s) {
                        s.slug.should.equal(a2.slug + "-test-projekt");

                        removeUser(artist2._id);
                        removeProject(project._id);
                        removeProject(proj2._id);
                        done();
                    })

                });

            });
        });
    });

    it('save() - validation should contain all required fileds', function (done) {
        new Project().save(function (err) {
            should.exist(err);
            should.exist(err.errors.category);
            should.exist(err.errors.title);
            should.exist(err.errors.teaserImage);
            should.exist(err.errors.youtubeUrl);
            should.exist(err.errors.moneyToRaise);
            should.not.exist(err.errors.defaultReward);
            done();
        });
    });

    it('save() - validation for "moneyToRaise" respects min val', function (done) {
        var project = projectFactory();
        project.moneyToRaise = 499;
        project.save(function (err) {
            should.exist(err);
            should.exist(err.errors.moneyToRaise);
            err.errors.moneyToRaise.type.should.equal('min');
            done();
        });
    });

    it('save() - validation for "moneyToRaise" respects max val', function (done) {
        project.moneyToRaise = 30001;
        project.save(function (err) {
            should.exist(err);
            should.exist(err.errors.moneyToRaise);
            err.errors.moneyToRaise.type.should.equal('max');
            done();
        });
    });

    it('save() - validation for "category" checks for enum value', function (done) {
        project.category = 'asdfasf';
        project.save(function (err) {
            should.exist(err);
            should.exist(err.errors.category);
            err.errors.category.type.should.equal('enum');
            done();
        });
    });

    it('save() - fails if it has neither "youtubeUrl" nor "teaserImage"', function (done) {
        project.teaserImage = null;
        project.youtubeUrl = null;
        project.save(function (err) {
            should.exist(err);
            should.exist(err.errors.teaserImage);
            should.exist(err.errors.youtubeUrl);
            done();
        });
    });

    it('save() - validation checks "youtubeUrl" format', function (done) {
        project.teaserImage = null;
        project.youtubeUrl = 'asdfasf';
        project.save(function (err) {
            should.exist(err);
            should.exist(err.errors.youtubeUrl);
            done();
        });
    });

    it('save() - saves when having "youtubeUrl" instead of "teaserImage"', function (done) {
        project = projectFactory();
        project.teaseImage = null;
        project.youtubeUrl = 'https://www.youtube.com/watch?v=E_LJaoiL2wQ';
        project.save(function (err) {
            should.not.exist(err);
            done();
        });
    });

    it('save() - associates a project with an artist', function (done) {
        project.artist = artist._id;
        project.save(function (err, pn) {
            should.not.exist(err);
            Project.findOne({
                artist: artist._id
            }, function (err, pnn) {
                should.not.exist(err);
                pnn.id.should.equal(pn.id);

                removeProject(project._id);
                removeUser(artist._id);
                done();
            });
        });
    });

    it('virtual property "public" returns only "true" if the state is "published", "expired" or "completed"', function () {
        var p = new Project();
        p.public.should.equal(false);
        p.state = 'publish-pending';
        p.public.should.equal(false);
        p.state = 'published';
        p.public.should.equal(true);
        p.state = 'expired';
        p.public.should.equal(true);
        p.state = 'completed';
        p.public.should.equal(true);
    });
});
