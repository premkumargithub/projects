'use strict';
var sticketMock = require('../mocks/support_tickets'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    SupportTicket = mongoose.model('SupportTicket'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var expectedHeader = Main.expectedHeader,
    successCode = Main.successCode;

var ticket_data = sticketMock.getCreateContentMock();

//Define the Support tickets API tests
describe('SupportTicket API tests: ', function () {

    var removeSTicket = function (id, done) {
        SupportTicket.remove({_id: id}, function () {
            done();
        });
    };

    it('should create a content', function (done) {
        server.inject({
            method: 'POST',
            url: '/support_tickets',
            payload: JSON.stringify(ticket_data),
            headers: { 'SupportTicket-Type': 'application/json' }
        }, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var sticketObj = JSON.parse(res.payload);
            var sticketData = sticketMock.getExpectedMock();
            if (!Main.validateTwoObjects(sticketData, sticketObj)) throw err;
            expect(sticketObj.firstname).to.equal(ticket_data.firstname);
            expect(sticketObj.lastname).to.equal(ticket_data.lastname);
            expect(sticketObj.message).to.equal(ticket_data.message);
            expect(sticketObj.category).to.equal(ticket_data.category);
            expect(sticketObj.email).to.equal(ticket_data.email);
            removeSTicket(sticketObj._id, done);
        });
    });

    it('should create a content and get its detail infos', function (done) {
        server.inject({
            method: 'POST',
            url: '/support_tickets',
            payload: JSON.stringify(ticket_data),
            headers: { 'SupportTicket-Type': 'application/json' }
        }, function (res) {
            expect(res.statusCode).to.equal(successCode);
            var pid = res.result.id;
            var sticketObj = JSON.parse(res.payload);
            server.inject({
                method: 'GET',
                url: '/support_tickets/' + pid
            }, function (res) {
                expect(res.statusCode).to.equal(successCode);
                expect(res.result.firstname).to.equal(ticket_data.firstname);            
                removeSTicket(sticketObj._id, done);
            });
        });
    });

    it('should delete a content', function (done) {
        server.inject({
            method: 'POST',
            url: '/support_tickets',
            payload: JSON.stringify(ticket_data),
            headers: { 'SupportTicket-Type': 'application/json' }
        }, function (res) {
            expect(res.statusCode).to.equal(successCode);
            var pid = res.result.id ;
            server.inject({
                method: 'DELETE',
                url: '/support_tickets/' + pid
            }, function (res) {

                expect(res.statusCode).to.equal(successCode);

                server.inject({
                    method: 'GET',
                    url: '/support_tickets/' + pid
                }, function (res) {
                    done();
                });
            });

        });
    });

    it('should update a content', function (done) {
        server.inject({
            method: 'POST',
            url: '/support_tickets',
            payload: JSON.stringify(ticket_data),
            headers: { 'SupportTicket-Type': 'application/json' }
        }, function (res) {
            expect(res.statusCode).to.equal(successCode);
            var pid = res.result.id ;
            var sticketObj = JSON.parse(res.payload);
            ticket_data.firstname = "very awesome content stuff" ;
            server.inject({
                method: 'PUT',
                url: '/support_tickets/' + pid,
                payload: JSON.stringify(ticket_data),
                headers: { 'SupportTicket-Type': 'application/json' }
            }, function (res) {
                expect(res.result.firstname).to.equal(ticket_data.firstname);
                removeSTicket(sticketObj._id, done);
            });
        });
    });

});

