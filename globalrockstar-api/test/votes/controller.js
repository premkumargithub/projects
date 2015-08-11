// 'use strict';
//
// var config = require('../../lib/database'),
//     models = require('../../models');
//
//
//
// var mongoose = require('mongoose'),
//     ObjectId = mongoose.Types.ObjectId;
//
// var Vote = mongoose.model('Vote');
//
// var should = require('should'),
//     chai = require('chai'),
//     expect = chai.expect;
//
//
//
// var vote_data = {
//     platform: 'android',
//     referrer: {
//         platform: 'twitter',
//         url: 'http://twitter.com'
//     },
//     artist: ObjectId(),
//     song: ObjectId(),
//     voter_artist: ObjectId()
// };
//
//
// var vote_id = null;
// var server = require('../../server');
//
// describe('REST Vote', function() {
//     before(function(done) {
//         Vote.remove().exec(function() {
//             done();
//         });
//     });
//
//     afterEach(function(done) {
//         done();
//     });
//
//     it('should create a vote', function(done) {
//         server.inject({
//             method: 'POST',
//             url: '/votes',
//             payload: JSON.stringify(vote_data),
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }, function(res) {
//             expect(res.statusCode).to.equal(200);
//             done();
//         });
//     });
//
//     it('should create a vote and get detail infos', function(done) {
//         server.inject({
//             method: 'POST',
//             url: '/votes',
//             payload: JSON.stringify(vote_data),
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }, function(res) {
//             expect(res.statusCode).to.equal(200);
//             var pid = res.result.id;
//             server.inject({
//                 method: 'GET',
//                 url: '/votes/' + pid
//             }, function(res) {
//                 expect(res.statusCode).to.equal(200);
//                 expect(res.result.platform).to.equal(vote_data.platform);
//                 done();
//             });
//         });
//     });
//
//
//
//     it('should delete a vote', function(done) {
//         server.inject({
//             method: 'POST',
//             url: '/votes',
//             payload: JSON.stringify(vote_data),
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }, function(res) {
//             expect(res.statusCode).to.equal(200);
//             var pid = res.result.id;
//
//             server.inject({
//                 method: 'DELETE',
//                 url: '/votes/' + pid
//             }, function(res) {
//
//                 expect(res.statusCode).to.equal(200);
//
//                 server.inject({
//                     method: 'GET',
//                     url: '/votes/' + pid
//                 }, function(res) {
//                     expect(res.statusCode).to.equal(404);
//                     done();
//                 });
//             });
//
//         });
//     });
//
//
//     it('should update a vote', function(done) {
//         server.inject({
//             method: 'POST',
//             url: '/votes',
//             payload: JSON.stringify(vote_data),
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         }, function(res) {
//             expect(res.statusCode).to.equal(200);
//             var pid = res.result.id;
//
//             vote_data.platform = "ios";
//
//             server.inject({
//                 method: 'PUT',
//                 url: '/votes/' + pid,
//                 payload: JSON.stringify(vote_data),
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             }, function(res) {
//                 expect(res.result.platform).to.equal("ios");
//                 done();
//             });
//
//         });
//     });
//
//
//
// });
