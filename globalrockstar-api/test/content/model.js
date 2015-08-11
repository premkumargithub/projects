'use strict';


var config = require('../../lib/database'),
    models = require('../../models') ;


var should = require('should'),
mongoose = require('mongoose'),
Content = mongoose.model('Content'),
chai = require('chai'),
expect = chai.expect ;

var ObjectId = mongoose.Types.ObjectId ;

var content ;

describe('Content Model', function() {
    before(function(done) {
        Content.find({}).remove(function(err,d) {
            content = new Content({
                title: 'Some content title',
                text: 'some html content'
            });

            done();
        }) ;
    });

    afterEach(function(done) {
        done();
    });

    it('should begin with noooo projects', function(done) {
        Content.find({}, function(err, contents) {
            contents.should.have.length(0);
            done();
        });
    });

    it('should save a project', function(done) {
        content.save(function(err,p) {
            Content.find({}, function(err, c) {
                expect(c.length).to.equal(1) ;
                done() ;
            })
        });
    });

    it('should fail when saving without title ', function(done) {
        content.title = null;
        content.save(function(err) {
            expect(err).to.exist ;
            done();
        });
    });

    it('should fail when saving without text ', function(done) {
        content.text = null;
        content.title = "some title" ;
        content.save(function(err) {
            expect(err).to.exist ;
            done();
        });
    });



});
