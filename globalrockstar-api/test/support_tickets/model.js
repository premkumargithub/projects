'use strict';
var sticketMock = require('../mocks/support_tickets'),
	config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    mongoose = require('mongoose'),
    SupportTicket = mongoose.model('SupportTicket'),
    chai = require('chai'),
    expect = chai.expect;

var ObjectId = mongoose.Types.ObjectId ;
var supportTicket;
var ticket_data = sticketMock.getCreateContentMock();

// describe('SupportTicket Model Schema tests:', function () {
//     before(function (done) {
//         SupportTicket.find({}).remove(function (err, d) {
//             SupportTicket = new SupportTicket({
//                 firstname: ticket_data.firstname
//                 lastname: ticket_data.lastname,
//                 email: ticket_data.email,
//                 category: ticket_data.category,
//                 message: ticket_data.message
//             });

//             done();
//         }) ;
//     });

//     afterEach(function (done) {
//         done();
//     });

// });
