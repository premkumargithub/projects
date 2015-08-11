'use strict';
var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    mongoose = require('mongoose'),
    Slider = mongoose.model('Slider'),
    chai = require('chai'),
    expect = chai.expect ;

var ObjectId = mongoose.Types.ObjectId ;
var slider ;

describe('Slider Model Schema tests:', function () {
    before(function (done) {
        Slider.find({}).remove(function (err, d) {
            slider = new Slider({
                name: 'Some slider title',
                text: 'some html slider',
                image: 'some html slider'
            });

            done();
        }) ;
    });

    afterEach(function (done) {
        done();
    });

    it('should begin with any projects', function (done) {
        Slider.find({}, function (err, sliders) {
            sliders.should.have.length(0);
            done();
        });
    });

    it('should save a project', function (done) {
        slider.save(function (err, p) {
            Slider.find({}, function (err, c) {
                expect(c.length).to.equal(1) ;
                done() ;
            })
        });
    });

    it('should fail when saving without title ', function (done) {
        slider.name = null;
        slider.save(function (err) {
            expect(err).to.exist ;
            done();
        });
    });
});
