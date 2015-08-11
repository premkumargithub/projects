'use strict';

var config = require('../../lib/database'),
models = require('../../models') ;

var mongoose = require('mongoose'),
Content = mongoose.model('Content') ;

var should = require('should'),
chai = require('chai'),
expect = chai.expect ;

;


var username = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});

var content_data = {
    title: 'some title' + username,
    text: username + 'awesome content html bla'
} ;

var server = require('../../index') ;

describe('REST Content', function() {
    before(function(done) {
        Content.remove().exec();
        done() ;
    });

    afterEach(function(done) {
        done();
    });

    it('should create a content', function(done) {
        server.inject({
            method: 'POST',
            url: '/contents',
            payload: JSON.stringify( content_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            expect(res.statusCode).to.equal(200) ;
            done() ;
        }) ;
    }) ;

    it('should create a content and get detail infos', function(done) {
        server.inject({
            method: 'POST',
            url: '/contents',
            payload: JSON.stringify( content_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            expect(res.statusCode).to.equal(200) ;
            var pid = res.result.id ;
            server.inject({
                method: 'GET',
                url: '/contents/'+pid
            }, function(res) {
                expect(res.statusCode).to.equal(200) ;
                expect(res.result.title).to.equal(content_data.title) ;
                done() ;
            }) ;
        }) ;
    }) ;



    it('should delete a content', function(done) {
        server.inject({
            method: 'POST',
            url: '/contents',
            payload: JSON.stringify( content_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            expect(res.statusCode).to.equal(200) ;
            var pid = res.result.id ;

            server.inject({
                method: 'DELETE',
                url: '/contents/'+pid
            }, function(res) {

                expect(res.statusCode).to.equal(200) ;

                server.inject({
                    method: 'GET',
                    url: '/contents/'+pid
                }, function(res) {
                    expect(res.statusCode).to.equal(404) ;
                    done() ;
                }) ;
            }) ;

        }) ;
    }) ;


    it('should update a content', function(done) {
        server.inject({
            method: 'POST',
            url: '/contents',
            payload: JSON.stringify( content_data ),
            headers: { 'Content-Type': 'application/json' }
        }, function(res) {
            expect(res.statusCode).to.equal(200) ;
            var pid = res.result.id ;

            content_data.title = "very awesome content stuff" ;
            server.inject({
                method: 'PUT',
                url: '/contents/'+pid,
                payload: JSON.stringify( content_data),
                headers: { 'Content-Type': 'application/json' }
            }, function(res) {
                expect(res.result.title).to.equal( content_data.title ) ;
                done() ;
            }) ;

        }) ;
    }) ;

}) ;
