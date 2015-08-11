/* globals describe, it, before, after, beforeEach, afterEach */

'use strict';

var config = require('../../lib/database');
var models = require('../../models');
var should = require('should');
var mongoose = require('mongoose');
var Artist = mongoose.model('Artist');
var slug = require('slug');
var Q = require('q');
var artistUtil = require('../util/artist');
var chai = require('chai');
var facebookInfo = require('../../helper/facebook-info');
var expect = chai.expect;

var artist;

describe('Artist Model', function () {
    before(function (done) {
        Artist.find({}).remove(function (err, c) {

            artist = new Artist({
                provider: 'local',
                name: 'Fake Artist',
                email: 'test@test.com',
                password: 'password123456',
                password_confirmation: 'password123456'
            });

            done();
        });
    });

    it('should begin with no artists', function (done) {
        Artist.find({}, function (err, artists) {
            artists.should.have.length(0);
            done();
        });
    });

    it('should fail when saving a duplicate artist', function (done) {
        artist.save(function (err, c) {
            var artistDup = new Artist({
                provider: 'local',
                name: 'Fake Artist',
                email: 'test@test.com',
                password: 'password123456',
                password_confirmation: 'password123456'
            });

            artistDup.save(function (err) {
                should.exist(err);
                done();
            });
        });

    });

    it('should get facebookId', function (done) {

        facebookInfo('https://www.facebook.com/edharcourtuk', function (err, fbId) {
            should.not.exist(err);
            expect(fbId).to.equal('16414586850');
            done();
        });

    });

    it('should prefix url with http automatically', function (done) {
        artist.website = 'notyce.net';
        artist.save(function (err, obj) {
            should.not.exist(err);
            obj.website.should.equal('http://notyce.net');
            done();
        });
    });

    it('should generate random slug when name is empty or unreadable',
        function (done) {
            var a = new Artist({
                name: '????? ?????',
                email: 'some-readable-email@host.com',
                password: 'password123456',
                password_confirmation: 'password123456'
            });

            a.save(function (err, obj) {
                should.exist(obj.slug);
                done();
            });
        });

    it('should fail when saving without an email', function (done) {
        artist.email = '';
        artist.save(function (err) {
            should.exist(err);
            done();
        });
    });

    it('should generate slug from title', function (done) {

        var slugArtist = new Artist({
            provider: 'local',
            name: 'my very special artist name <3',
            email: 'test12321@test.com',
            password: 'password123456',
            password_confirmation: 'password123456'
        });

        slugArtist.save(function (err, savedArtist) {
            should.not.exist(err);
            savedArtist.slug.should.equal(slug(slugArtist.name));
            done();
        });
    });

    it('should never everrrrr change the slug', function (done) {
        var slugArtist = new Artist({
            provider: 'local',
            name: 'seymour glass',
            email: 'test12333333321@test.com',
            password: 'password123456',
            password_confirmation: 'password123456'
        });

        slugArtist.save(function (err, savedArtist) {
            should.not.exist(err);
            savedArtist.slug.should.equal(slug(slugArtist.name));
            var aslug = savedArtist.slug;

            slugArtist.name = 'zooey glass';
            slugArtist.save(function (err, updatedArtist) {
                should.not.exist(err);
                updatedArtist.slug.should.equal(aslug);
                done();
            });
        });
    });

    it('should fail when password confirmation does not match', function (
        done) {
        artist.password_confirmation = 'buha';
        artist.save(function (err) {
            should.exist(err);
            done();
        });
    });

    it('should authenticate artist if password is valid', function (done) {
        artist.authenticate(artist.email, function (err, obj) {
            should.exist(obj);
            done();
        });
    });

    it('should not authenticate artist if password is invalid', function (
        done) {
        artist.authenticate('123', function (err, obj) {
            obj.should.equal(false);
            done();
        });
    });

    it('should fail when saving without a password', function (done) {
        artist.password = '';
        artist.save(function (err) {
            should.exist(err);
            done();
        });
    });

    it('should fail when saving without a name', function (done) {
        artist.name = '';
        artist.save(function (err) {
            should.exist(err);
            done();
        });
    });

    it('should generate a verification token on create', function (done) {

        var slugArtist = new Artist({
            provider: 'local',
            name: 'some name',
            email: 'test123212321-another@test.com',
            password: 'password123456',
            password_confirmation: 'password123456'
        });

        slugArtist.save(function (err, savedFan) {
            should.not.exist(err);
            should.exist(savedFan.verificationToken);
            done();
        });

    });

    it('should fail when email is not a real email', function (done) {

        artist.name = 'dsfdsdfsd';
        artist.email = 'this is not the email you are looking for';
        artist.save(function (err) {
            should.exist(err);
            done();
        });

    });

    it('save() - generates a new unique slug for each artist', function (done) {
        console.error('FIXME: slug generation cannot handle paralell saves');
        done();
        /*
         Q.all([
               Q.ninvoke(artistUtil.validArtist(),'save'),
               Q.ninvoke(artistUtil.validArtist(),'save'),
               Q.ninvoke(artistUtil.validArtist(),'save'),
               Q.ninvoke(artistUtil.validArtist(),'save'),
               Q.ninvoke(artistUtil.validArtist(),'save')
        ]).then(function(as) {
            var slugs = [];
            for(var i = 0; i < as.length; i++) {
                expect(slugs.indexOf(as[i].slug)).to.equal(-1);
                slugs.push(as[i].slug);
            }
            done();
        }).fail(function(err) {
            done(err);
        });*/
    });

    it('Artist.updatePayPalAccount(...) updateds the artist\'s paypal accountn fields', function (done) {
        var art;
        artistUtil.savedArtist()
            .then(function (_artist) {
                art = _artist;
                return Artist.updatePayPalAccount(art._id, 'paypal@artist.com', 'PP_firstname', 'PP_lastname', 'USD', true);
            })
            .then(function (updated) {
                return Q.ninvoke(Artist.findOne({
                    _id: art._id
                }), 'exec');
            })
            .then(function (res) {
                expect(res.paypal_email).to.equal('paypal@artist.com');
                expect(res.paypal_firstname).to.equal('PP_firstname');
                expect(res.paypal_lastname).to.equal('PP_lastname');
                expect(res.paypal_currency).to.equal('USD');
                expect(res.paypal_verified).to.equal(true);
                done();
            }).fail(function (err) {
                console.error(err);
                done(err);
            });
    });

});
