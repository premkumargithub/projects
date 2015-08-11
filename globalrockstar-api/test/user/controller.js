'use strict';

var config = require('../../lib/database'),
models = require('../../models') ;

var mongoose = require('mongoose'),
Artist = mongoose.model('Artist');

var should = require('should'),
    chai = require('chai'),
    expect = chai.expect ;


var artist_data = {
    name: "some name",
    email: "user@host.com",
    password: "123456789",
    password_confirmation: "123456789",
    toc: true,
    newsletter: true
} ;


var server = require('../../index') ;

describe('REST Artist', function() {
    before(function(done) {
        Artist.remove().exec();
        done();
    });

    afterEach(function(done) {
        Artist.remove().exec();
        done();
    });

    it('should create an artist', function(done) {
        server.inject({
            method: 'POST',
            url: '/artists',
            payload: JSON.stringify( artist_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            expect(res.statusCode).to.equal(200) ;
            done() ;
        }) ;
    }) ;


    it('should fail when creating artists with same name', function(done) {

        server.inject({
            method: 'POST',
            url: '/artists',
            payload: JSON.stringify( artist_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            server.inject({
                method: 'POST',
                url: '/artists',
                payload: JSON.stringify( artist_data ),
                headers: { 'Content-Type': 'application/json' }
            }, function(res) {
                expect(res.statusCode).to.equal(400) ;
                done() ;
            }) ;
        }) ;
    }) ;



    it('should update an existing artist', function(done) {

        Artist.create({
            name:"some name",
            email:"update@host.com",
            password: "123456789",
            password_confirmation:"123456789"
        }, function(err,obj) {
            server.inject({
                method: 'PUT',
                url: '/artists/'+obj._id,
                payload: JSON.stringify( {
                    name:"new name",
                    email:"update@host.com",
                    newsletter: false,
                    city: "city",
                    country: "country",
                    genres_music: ['punk rock'],
                    genres_own: ['doom metal'],
                    picture: 'path/to/my/image.jpg',
                    birthdate: "1752-05-17T00:00:00.000Z",
                    contact: {
                        first_name: "Homer",
                        last_name: "Simpson",
                        gender: "male",
                        address: "evergreen terrace",
                        postal_code: "12345",
                        city: "Springfield",
                        country: "somewhere in US",
                        telephone: "35435131",
                        birthdate: "1752-05-17T00:00:00.000Z"
                    },
                    paypal_email: "support@paypal.com"
                } ),
                headers: { 'Content-Type': 'application/json' }
            }, function(res) {
                expect(res.statusCode).to.equal(200) ;
                expect(JSON.parse(res.payload).name).to.equal('new name') ;
                done() ;
            }) ;
        }) ;


        ;
    }) ;



    it('should fail when updating an artist without values', function(done) {

        Artist.create({
            name:"some name",
            email:"update@host.com",
            password: "123456789",
            password_confirmation:"123456789"
        }, function(err,obj) {
            server.inject({
                method: 'PUT',
                url: '/artists/'+obj._id,
                payload: JSON.stringify( {name:"new name"} ),
                headers: { 'Content-Type': 'application/json' }
            }, function(res) {
                expect(res.statusCode).to.equal(400) ;
                done() ;
            }) ;
        }) ;


        ;
    }) ;

    it('should fail when password is too short', function(done) {

        artist_data.password = "12" ;


        server.inject({
            method: 'POST',
            url: '/artists',
            payload: JSON.stringify( artist_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            expect(res.statusCode).to.equal(400) ;
            done() ;
        }) ;
    }) ;

    it('should fail when password confirmation does not match', function(done) {

        artist_data.password = "123456789" ;
        artist_data.password_confirmation = "123456789123456" ;

        server.inject({
            method: 'POST',
            url: '/artists',
            payload: JSON.stringify( artist_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            expect(res.statusCode).to.equal(400) ;
            done() ;
        }) ;

    }) ;


    it('should delete an artist', function(done) {
        Artist.create({name:"some other name", email:"updatee@host.com", password: "123456789", password_confirmation:"123456789" }, function(err,obj) {
            server.inject({
                method: 'DELETE',
                url: '/artists/'+obj._id,
            }, function(res) {
                expect(res.statusCode).to.equal(200) ;
                Artist.findOne({_id: obj._id}, function(err,artist) {
                    expect(artist).to.not.exist;
                    done() ;
                }) ;
            }) ;
        }) ;

    }) ;

}) ;
