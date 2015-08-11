'use strict';
var sliderMock = require('../mocks/slider'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Slider = mongoose.model('Slider'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');
    
var Main = require('../main');
var expectedHeader = Main.expectedHeader,
    successCode = Main.successCode;

//TODO: Remove this one 
var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

var object_data = sliderMock.getCreateSliderMock();

describe('Slider API tests: ', function () {

    var removeSlider = function (id, done) {
        Slider.remove({_id: id}, function () {
            done();
        });
    };

    it('should return the slider list in json object', function (done) {
        var options = {
            method: "GET",
            url: "/sliders"
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            done();
        });
    });

    it('should create a slider', function (done) {
        var options = {
            method: "POST",
            url: "/sliders",
            payload: JSON.stringify(object_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            res.should.have.property('payload');
            var sliderObj = JSON.parse(res.payload);
            var expected = sliderMock.getExpectedMock();
            if (!Main.validateTwoObjects(expected, sliderObj)) throw err;
            expect(res.statusCode).to.equal(successCode);
            removeSlider(sliderObj._id, done);
        });
    });

    it('should create a slider and get its detail infos', function (done) {
        var options = {
            method: "POST",
            url: "/sliders",
            payload: JSON.stringify(object_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            res.should.have.property('payload');
            var sliderObj = JSON.parse(res.payload);
            var expected = sliderMock.getExpectedMock();
            if (!Main.validateTwoObjects(expected, sliderObj)) throw err;
            expect(res.statusCode).to.equal(successCode);
            var pid = res.result.id;
            server.inject({
                method: 'GET',
                url: '/sliders/' + pid
            }, function (res) {
                res.should.have.property('payload');
                var result = JSON.parse(res.payload);
                var expected = sliderMock.getExpectedMock();
                if (!Main.validateTwoObjects(expected, result)) throw err;
                expect(res.statusCode).to.equal(successCode);
                expect(res.result.title).to.equal(object_data.title);
                removeSlider(sliderObj._id, done);
            });
        });
    });

    it('should create then delete a slider', function (done) {
        var options = {
            method: "POST",
            url: "/sliders",
            payload: JSON.stringify(object_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            var pid = res.result.id ;

            server.inject({
                method: 'DELETE',
                url: '/sliders/' + pid
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                server.inject({
                    method: 'GET',
                    url: '/sliders/' + pid
                }, function (res) {
                    expect(res.statusCode).to.equal(404);
                    done();
                });
            });

        });
    });

    it('should create then update a slider', function (done) {
        server.inject({
            method: 'POST',
            url: '/sliders',
            payload: JSON.stringify(object_data),
            headers: { 'Content-Type': 'application/json' }
        }, function (res) {
            expect(res.statusCode).to.equal(successCode);
            var pid = res.result.id ;
            var sliderObj = JSON.parse(res.payload);
            object_data.name = "very awesome slider stuff" ;
            server.inject({
                method: 'PUT',
                url: '/sliders/' + pid,
                payload: JSON.stringify(object_data),
                headers: { 'Content-Type': 'application/json' }
            }, function (res) {
                expect(res.result.name).to.equal(object_data.name);
                removeSlider(sliderObj._id, done);
            });

        });
    });

});

