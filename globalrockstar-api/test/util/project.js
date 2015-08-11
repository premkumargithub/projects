'use strict';

var config = require('../../lib/database'),
    models = require('../../models'),
    should = require('should'),
    Q = require('q'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    Project = mongoose.model('Project'),
    Artist = mongoose.model('Artist'),
    Song = mongoose.model('Song'),
    songUtil = require('../util/song'),
    _ = require('lodash');

function projectFactory(title) {
    return new Project({
        _id: ObjectId(),
        category: 'Album',
        title: title ? title : 'some title ' + ObjectId(),
        teaserImage: 'some/crazy/path',
        moneyToRaise: 12000,
        currency: 'USD',
        defaultReward: new ObjectId(),
        rewards: ['Free song', 'Free Download', 'CD', 'CD plus T-Shirt', 'New Car!']
    });
}

function validProject(title) {
    return new Q(projectFactory(title));
}

function savedProject(title) {
    var project;
    var song;
    return songUtil.savedSong()
        .then(function (s) {
            song = s;
            return validProject(title);
        })
        .then(function (p) {
            project = p;
            project.defaultReward = song._id;
            return Q.ninvoke(project, 'save');
        })
        .then(function () {
            return Q.ninvoke(Project.findOne({
                _id: project._id
            }), 'exec');
        });
}

module.exports = {
    validProject: validProject,
    savedProject: savedProject,
};
