'use strict';
var contestMock = require('../mocks/contest'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Contest = mongoose.model('Contest'),
    Artist = mongoose.model('Artist'),
    artistsMock = require('../mocks/artists.js'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var expectedHeader = Main.expectedHeader,
    successCode = Main.successCode,
    artist_data = artistsMock.getArtistMock(),
    sliderData = require('../mocks/slider.js');

var fromNow = function (n) {
    var today = new Date();
    return today.setDate(today.getDate() + n);
}

var today = new Date();
var timeRange = {
    start: today,
    end: today
};

var obj_data = {
    name: "2014",
    cfe: {
        time: {
            start: today,
            end: fromNow(1)
        }
    },
    np: {
        time: {
            start: fromNow(1),
            end: fromNow(2)
        }
    },
    globalfinalsQualification: {
        time: {
            start: fromNow(2),
            end: fromNow(3)
        }
    },
    globalfinalsBest64: {
        time: {
            start: fromNow(3),
            end: fromNow(4)
        }
    },
    globalfinalsBest16: {
        time: {
            start: fromNow(4),
            end: fromNow(5)
        }
    }
}

describe('Contest API tests: ', function () {
    
    var removeContest = function (id, done) {
        Contest.remove({_id: id}, function () {
            done();
        });
    };

    it('should create a contest', function (done) {
        var options = {
            method: "POST",
            url: "/contests",
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };

        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var contestObj = JSON.parse(res.payload);
            var expected = contestMock.getExpectedMock();
            if (!Main.validateTwoObjects(expected, contestObj)) throw err;
            removeContest(contestObj.id, done);
        }) ;
    }) ;

    it('should create a contest and get its detail infos', function (done) {
        var options = {
            method: 'POST',
            url: '/contests',
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.result.should.have.property('id');
            var contestObj = JSON.parse(res.payload);
            var pid = res.result.id ;
            server.inject({
                method: 'GET',
                url: '/contests/' + pid
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                expect(res.result.name).to.equal(obj_data.name);
                res.should.have.property('payload');
                var result = JSON.parse(res.payload);
                var expected = contestMock.getExpectedMock();
                if (!Main.validateTwoObjects(expected, result)) throw err;
                removeContest(contestObj.id, done);
            });
        });
    });

    it('should create and then delete a contest', function (done) {
        var options = {
            method: 'POST',
            url: '/contests',
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };

        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.result.should.have.property('id');
            var pid = res.result.id;
            server.inject({
                method: 'DELETE',
                url: '/contests/' + pid
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);

                server.inject({
                    method: 'GET',
                    url: '/contests/' + pid
                }, function (res) {
                    expect(res.statusCode).to.equal(404);
                    done();
                });
            });
        });
    });

    it('should update a contest', function (done) { 
        var options = {
            method: 'POST',
            url: '/contests',
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };

        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.result.should.have.property('id');
            var contestObj = JSON.parse(res.payload);
            var pid = res.result.id;
            
            obj_data.name = "very awesome contest stuff";
            server.inject({
                method: 'PUT',
                url: '/contests/' + pid,
                payload: JSON.stringify(obj_data),
                headers: { 'Content-Type': 'application/json' }
            }, function (res) {
                expect(res.result.name).to.equal(obj_data.name);
                removeContest(contestObj.id, done);
            });
        });
    });

    it('should get the information of next upcoming contest', function (done) {
        obj_data.name = '2015'
        obj_data.cfe.time.start = fromNow(2);
        obj_data.cfe.time.end = fromNow(3);
        var options = {
            method: 'POST',
            url: '/contests',
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.result.should.have.property('id');
            var contestObj = JSON.parse(res.payload);
            server.inject({
                method: 'GET',
                url: '/contests/next',
                headers: { 'Content-Type': 'application/json' }
            }, function (res) {
                var payload = JSON.parse(res.payload);
                expect(res.statusCode).to.equal(200);
                expect(payload).to.have.length.above(0);
                removeContest(contestObj.id, done);
            });
        });
    });
    it('should get the current phase of the contest', function (done) {
        obj_data.name = '2015',
        obj_data.cfe.time.start = today.setDate(today.getDate() - 3),
        obj_data.cfe.time.end = today.setDate(today.getDate() - 2),
        obj_data.np.time.start = today,
        obj_data.np.time.end = fromNow(2);
        var options = {
            method: 'POST',
            url: '/contests',
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.result.should.have.property('id');
            var contestObj = JSON.parse(res.payload);
            var contestId = contestObj.id;
            server.inject({
                method: 'GET',
                url: '/contest/' + contestId + '/currentPhase',
                headers: { 'Content-Type': 'application/json' }
            }, function (res) {
                var payload = JSON.parse(res.payload);
                expect(res.statusCode).to.equal(200);
                expect(payload[0]).to.equal('np')
                removeContest(contestObj.id, done);
            });
        });
    });

    it('should get the current phase of the contest during the overlapping of the phase', function (done) {
        obj_data.name = '2015',
        obj_data.cfe.time.start = today.setDate(today.getDate() - 3),
        obj_data.cfe.time.end = fromNow(1),
        obj_data.np.time.start = today,
        obj_data.np.time.end = fromNow(3);
        var options = {
            method: 'POST',
            url: '/contests',
            payload: JSON.stringify(obj_data),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.result.should.have.property('id');
            var contestObj = JSON.parse(res.payload);
            var contestId = contestObj.id;
            server.inject({
                method: 'GET',
                url: '/contest/' + contestId + '/currentPhase',
                headers: { 'Content-Type': 'application/json' }
            }, function (res) {
                var payload = JSON.parse(res.payload);
                expect(res.statusCode).to.equal(200);
                expect(payload[0]).to.equal('cfe');
                expect(payload[1]).to.equal('np');
                removeContest(contestObj.id, done);
            });
        });
    });
    
    it('should return the Info about the participation of the artist in the upcoming contest', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(artist_data),
            headers: {'Content-Type': 'application/json'}
        };
        server.inject(options, function (res) {
            var artistObj = JSON.parse(res.payload);
            obj_data.name = '2015'
            obj_data.cfe.time.start = fromNow(2);
            obj_data.cfe.time.end = fromNow(3);
            var contestOption = {
                method: 'POST',
                url: '/contests',
                payload: JSON.stringify(obj_data),
                headers: { 'Content-Type': 'application/json' }
            };
            server.inject(contestOption, function (res) {
                expect(res.statusCode).to.equal(successCode);
                res.result.should.have.property('id');
                var contestObj = JSON.parse(res.payload);
                var pid = res.result.id;
                server.inject({
                    method: "GET",
                    url: '/contests/next/participate/' + artistObj.slug,
                    headers: {'Content-Type': 'application/json'}
                }, function (res) {
                    var participateData = JSON.parse(res.payload);
                    expect(res.statusCode).to.equal(successCode);
                    expect(participateData.isParticipated).to.equal(false);
                    Artist.remove({_id : artistObj.id}, function () {
                        removeContest(contestObj.id, done);
                    })
                });
            });
        });
    });
}) ;
