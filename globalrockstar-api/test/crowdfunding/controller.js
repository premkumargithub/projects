/* globals describe, it, before, after, beforeEach, afterEach */
/*jshint -W030 */
'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Q = require('q'),
    Project = mongoose.model('Project'),
    Payment = mongoose.model('Payment'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect;
chai.use(require('chai-datetime'));
chai.use(require('chai-things'));

var dbUtil = require('../util/db'),
    artistUtil = require('../util/artist'),
    songUtil = require('../util/song'),
    projectUtil = require('../util/project'),
    fanUtil = require('../util/fan'),
    eventSpy = require('../util/eventSpy'),
    srv = require('../../index'),
    wrapper = require('../util/injectWrapper')(srv);
    
var existingArtist;
var existingProject;
var existingArtist2;
var existingProject2;
var existingProject3;
var existingProject4;
var deletedProject;
var fan1;
var fan2;
var fan3;
var fan4;
var fan5;
var fan6;

describe('REST Crowdfunding API tests: ', function () {
    beforeEach(function (done) {
        dbUtil.resetDB()
            .then(function () {
                return Q.all([
                    artistUtil.savedArtist(),
                    fanUtil.savedFan(),
                    fanUtil.savedFan(),
                    fanUtil.savedFan(),
                    fanUtil.savedFan(),
                    fanUtil.savedFan(),
                    fanUtil.savedFan(),

                ]);
            })
            .spread(function (art, f1, f2, f3, f4, f5, f6) {
                existingArtist = art;
                fan1 = f1;
                fan2 = f2;
                fan3 = f3;
                fan4 = f4;
                fan5 = f5;
                fan6 = f6;

                fan1.firstname = 'fn_fan1';
                fan1.lastname = 'ln_fan1';
                fan1.picture = 'pic_fan1';

                fan2.firstname = 'fn_fan2';
                fan2.lastname = 'ln_fan2';
                fan2.picture = 'pic_fan2';

                fan3.firstname = 'fn_fan3';
                fan3.lastname = 'ln_fan3';
                fan3.picture = 'pic_fan3';

                fan4.firstname = 'fn_fan4';
                fan4.lastname = 'ln_fan4';
                fan4.picture = 'pic_fan4';

                fan5.firstname = 'fn_fan5';
                fan5.lastname = 'ln_fan5';
                fan5.picture = 'pic_fan5';

                fan6.firstname = 'fn_fan6';
                fan6.lastname = 'ln_fan6';
                fan6.picture = 'pic_fan6';

                return Q.all([
                    projectUtil.savedProject('some title'),
                    Q.ninvoke(fan1, 'save'),
                    Q.ninvoke(fan2, 'save'),
                    Q.ninvoke(fan3, 'save'),
                    Q.ninvoke(fan4, 'save'),
                    Q.ninvoke(fan5, 'save'),
                    Q.ninvoke(fan6, 'save')
                ]);
            })
            .spread(function (proj) {
                existingProject = proj;
                existingProject.artist = existingArtist._id;
                return Q.ninvoke(existingProject, 'save');
            })
            .then(function () {
                return projectUtil.savedProject('some title');
            })
            .then(function (projDeleted) {

                deletedProject = projDeleted;
                deletedProject.artist = existingArtist._id;
                deletedProject.deleted = new Date();
                return Q.all([
                    Q.ninvoke(deletedProject, 'save')
                ]);
            })
            .then(function () {
                return artistUtil.savedArtist();
            })
            .then(function (art) {
                existingArtist2 = art;
                existingArtist.picture = 'art_pic';
                existingArtist2.picture = 'art2_pic';
                return projectUtil.savedProject('some title');
            })
            .then(function (proj) {
                var date = new Date();
                date.setDate(date.getDate() + 42);
                existingProject2 = proj;
                existingProject2.releaseDate = date;
                existingProject2.moneyToRaise = 6666;
                existingProject2.state = 'published';
                existingProject2.artist = existingArtist2._id;

                return Q.all([
                    Q.ninvoke(existingProject2, 'save'),
                    Q.ninvoke(existingArtist, 'save'),
                    Q.ninvoke(existingArtist2, 'save'),
                ]);
            })
            .then(function () {
                return projectUtil.savedProject('some title');
            })
            .then(function (proj) {
                var releseDate = new Date(2001, 8, 11);
                existingProject3 = proj;
                existingProject3.state = 'expired';
                existingProject3.releaseDate = releseDate;
                existingProject3.artist = existingArtist._id;
                return Q.all([
                    Q.ninvoke(existingProject3, 'save'),
                    Payment.createPayment('Fan', fan1._id, 'Project', existingProject2._id, 42, {}, 42, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Fan', fan1._id, 'Project', existingProject2._id, 42, {}, 42, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Fan', fan3._id, 'Project', existingProject2._id, 62, {}, 62, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Fan', fan2._id, 'Project', existingProject2._id, 2, {}, 2, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Fan', fan6._id, 'Project', existingProject2._id, 4, {}, 4, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Fan', fan2._id, 'Project', existingProject2._id, 82, {}, 82, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Fan', fan4._id, 'Project', existingProject2._id, 52, {}, 52, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Fan', fan2._id, 'Project', existingProject2._id, 4, {}, 4, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Artist', existingArtist._id, 'Project', existingProject2._id, 42, {}, 42, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Artist', existingArtist._id, 'Project', existingProject2._id, 42, {}, 42, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                    Payment.createPayment('Artist', existingArtist._id, 'Project', existingProject2._id, 292, {}, 292, 1)
                    .then(function (pmt) {
                        return Payment.commit(pmt._id);
                    }),
                ]);
            })
            .then(function () {
                return projectUtil.savedProject('some title');
            })
            .then(function (proj) {
                var releseDate = new Date(2001, 8, 11);
                existingProject4 = proj;
                existingProject4.state = 'completed';
                existingProject4.releaseDate = releseDate;
                existingProject4.artist = existingArtist._id;
                return Q.ninvoke(existingProject4, 'save');
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            });
    });

    afterEach(function (done) {
        done();
    });

    it('GET /crowdfunding - returns "published", "compleed" and "expired" projects', function (done) {
        srv.inject({
            method: 'GET',
            url: '/crowdfunding',
        }, function (res) {
            expect(res.statusCode).to.equal(200);
            expect(_.find(res.result.items, function (p) {
                return p._id.toString() === existingProject._id.toString();
            })).not.to.exist;

            expect(_.find(res.result.items, function (p) {
                return p._id.toString() === existingProject2._id.toString();
            })).to.exist;

            expect(_.find(res.result.items, function (p) {
                return p._id.toString() === existingProject3._id.toString();
            })).to.exist;

            expect(_.find(res.result.items, function (p) {
                return p._id.toString() === existingProject4._id.toString();
            })).to.exist;

            expect(_.find(res.result.items, function (p) {
                return p._id.toString() === deletedProject._id.toString();
            })).not.to.exist;
            done();
        });
    });

    it('GET /crowdfunding/{slug} - returns project with the given slug', function (done) {
        Q.ninvoke(wrapper, 'inject', {
            method: 'GET',
            url: '/crowdfunding/2-fake-artist-some-title',
        }).then(function (res) {
            expect(res.statusCode).to.equal(200);
            expect(res.result.slug).to.equal('2-fake-artist-some-title');

            done();
        }).fail(done);

    });

    it('GET /crowdfunding/{slug} - returns 404 if no project exists for the given slug', function (done) {
        srv.inject({
            method: 'GET',
            url: '/crowdfunding/des-gibts-ned',
        }, function (res) {
            expect(res.statusCode).to.equal(404);
            done();
        });

    });

    it('GET /crowdfunding/{slug} - returns 404 for not published projects', function (done) {
        srv.inject({
            method: 'GET',
            url: '/crowdfunding/fake-artist-some-title',
        }, function (res) {
            expect(res.statusCode).to.equal(404);
            done();
        });
    });

    it('GET /crowdfunding/{slug} - returns a random selection of project supporters', function (done) {
        Q.ninvoke(wrapper, 'inject', {
            method: 'GET',
            url: '/crowdfunding/' + existingProject2.slug,
        }).then(function (res) {
            expect(res.statusCode).to.equal(200);
            expect(res.result.backers).to.exist;
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it('GET /crowdfunding/{slug} - supporters do not contains duplicates', function (done) {
        Q.ninvoke(wrapper, 'inject', {
            method: 'GET',
            url: '/crowdfunding/' + existingProject2.slug,
        }).then(function (res) {
            expect(res.statusCode).to.equal(200);
            expect(res.result.backers).to.exist;
            var ids = [];
            _.each(res.result.backers, function (sup) {
                if (ids.indexOf(sup._id) === -1) {
                    ids.push(sup._id);
                }
            });
            expect(res.result.backers.length).to.equal(ids.length);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it('GET /crowdfunding/{slug} - calculates the numbers of days left', function (done) {
        Q.ninvoke(wrapper, 'inject', {
            method: 'GET',
            url: '/crowdfunding/' + existingProject2.slug,
        }).then(function (res) {
            expect(res.statusCode).to.equal(200);
            expect(res.result.daysLeft).to.equal(42);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it('GET /crowdfunding/{slug} - calculates moneyRaisedYet', function (done) {
        Q.ninvoke(wrapper, 'inject', {
            method: 'GET',
            url: '/crowdfunding/' + existingProject2.slug,
        }).then(function (res) {
            expect(res.statusCode).to.equal(200);
            expect(res.result.moneyRaisedYet).to.equal(666);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it('GET /crowdfunding/{slug} - calculates percentage of money raised', function (done) {
        Q.ninvoke(wrapper, 'inject', {
            method: 'GET',
            url: '/crowdfunding/' + existingProject2.slug,
        }).then(function (res) {
            expect(res.statusCode).to.equal(200);
            expect(res.result.percentDone).to.equal(10);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it.skip('GET /crowdfunding/{slug} - supporters list always conatains the current user if he donarted to the project');

});
