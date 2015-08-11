'use strict';
var projectsMock = require('../mocks/projects'),
    artitsMock = require('../mocks/artists'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    Artist = mongoose.model('Artist'),
    Project = mongoose.model('Project'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var successCode = Main.successCode,
    artistObj,
    projectsObj;
    
describe('Activity API tests:', function () {

    var removeUser = function (id) {
        Artist.remove({_id: id}, function () {
            return;
        });
    };

    var removeProject = function (id) {
        Project.remove({_id: id}, function () {
            return;
        });
    };

    it('Should create an artist who will create the projects', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(artitsMock.getArtistMock()),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            artistObj = JSON.parse(res.payload);
            var expected = artitsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;

            done();
        });
    });

    it('Should create a project by an artist', function (done) {
        var options = {
            method: "POST",
            url: "/artists/" + artistObj.id + "/projects",
            payload: JSON.stringify(projectsMock.getProjectsMock()),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            projectsObj = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsObj)) throw err;

            done();
        });
    });

    it('Should returns only project that have not been marked as deleted', function (done) {
        var options = {
            method: "GET",
            url: "/projects",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (projectsResult.items.length > 0)
            if (!Main.validateTwoObjects(expected, projectsResult.items[0])) throw err;

            done();
        });
    });

    it('Should returns all project including those marked as deleted', function (done) {
        var options = {
            method: "GET",
            url: "/projects?showdeleted=1",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult.items[0])) throw err;

            done();
        });
    });

    it('Should returns first page of the "asc" sorted result by field "moneyToRaise"', function (done) {
        var options = {
            method: "GET",
            url: "/projects?sort=moneyToRaise",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult.items[0])) throw err;

            done();
        });
    });

    it('Should returns first page of the "desc" sorted result by field "moneyToRaise"', function (done) {
        var options = {
            method: "GET",
            url: "/projects?sort=-moneyToRaise",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult.items[0])) throw err;

            done();
        });
    });

    it('Should returns only project with the state "published"', function (done) {
        var options = {
            method: "GET",
            url: "/projects?search[state]=published",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (projectsResult.itemCount > 0)
            if (!Main.validateTwoObjects(expected, projectsResult.items[0])) throw err;

            done();
        });
    });

    it('Should mark-deleted marks the project as "deleted"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/mark-deleted",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            projectsResult.should.have.property('deleted');
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should remove the deletion mark from the project', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/revive",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should update project state as "publish-pending"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/state/publish-pending",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            projectsResult.should.have.property('state');
            expect(projectsResult.state).to.equal('publish-pending');
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should update project state as "published"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/state/published",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            projectsResult.should.have.property('state');
            expect(projectsResult.state).to.equal('published');
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should update project state as "completed"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/state/completed",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            projectsResult.should.have.property('state');
            expect(projectsResult.state).to.equal('completed');
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should update project state as "expired"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/state/expired",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            projectsResult.should.have.property('state');
            expect(projectsResult.state).to.equal('expired');
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should update project state as "expired"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/state/expired",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            projectsResult.should.have.property('state');
            expect(projectsResult.state).to.equal('expired');
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should returns all projects for an artist', function (done) {
        var options = {
            method: "GET",
            url: "/artists/" + artistObj.id + "/projects",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult[0])) throw err;
            done();
        });
    });

    it('Should returns a project details for an artist', function (done) {
        var options = {
            method: "GET",
            url: "/artists/" + artistObj.id + "/projects/" + projectsObj._id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should activate a project for an artist', function (done) {
        var options = {
            method: "PUT",
            url: "/artists/" + artistObj.id + "/projects/" + projectsObj._id + "/activate",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should deactivate a project for an artist', function (done) {
        var options = {
            method: "PUT",
            url: "/artists/" + artistObj.id + "/projects/" + projectsObj._id + "/deactivate",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should set project feature property to "true"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/feature/true",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should set project feature property to "false"', function (done) {
        var options = {
            method: "PUT",
            url: "/projects/" + projectsObj._id + "/feature/false",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var projectsResult = JSON.parse(res.payload);
            var expected = projectsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, projectsResult)) throw err;
            done();
        });
    });

    it('Should delete the project', function (done) {
        var options = {
            method: "DELETE",
            url: "/projects/" + projectsObj._id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(204);

            removeUser(artistObj.id);
            //removeProject(projectsObj._id);
            done();
        });
    });

});
