'use strict';
/**
 *@module Controller:Sliders
 *@description this modulle is used for service of sliders activities
 *Required modules are defined here
 *@requires module:mongoose
 *@requires module:Slider
 *@requires module:hapi
 *@requires module:../lib/mongoose-hapi-errors
 *@requires module:q
 **/
var mongoose = require('mongoose');
var Slider = mongoose.model('Slider');
var Hapi = require('hapi');
var reformatErrors = require('../lib/mongoose-hapi-errors');

var Q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var findSlider = Q.nbind(Slider.findOne, Slider);
var findSliders = Q.nbind(Slider.find, Slider);

/**
 * @function Controller:Sliders.errorCallback
 * @param {object} err Error type of object
 * @description This is used for reformating the error object
 * @returns {object}
 */
var errorCallback = function (err, reply) {
    return reply(reformatErrors(err));
};

module.exports = {
    /**
     * @name Controller:Sliders.index
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for retrieving the sliders from the Slider model
     * returns {object} object
     **/
    index: function (req, reply) {
        if (req.params.id) {
            var query = {
                $or: [{slug: req.params.id}]
            };

            if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({_id: req.params.id});
            }

            if (req.query.search && req.query.search.public) {
                query.public = true;
            }

            findSliders(query)
                .then(function (slider) {
                    if (!slider) {
                        reply(Hapi.error.notFound());
                    } else {
                        reply(slider);
                    }
                })
                .fail(errorCallback).bind(this);

        } else {
            var sortBy = req.query.sort || "position";
            Slider.find(req.pre.search).sort(sortBy).exec()
                .then(function (sliders) {
                    reply(sliders);
                }, errorCallback);
        }
    },
    /**
     * @name Controller:Sliders.create
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for saving the slider in the Slider model
     * returns {object} object
     **/
    create: function (req, reply) {
        var slider = new Slider(req.payload);
        slider.save(function (err, obj) {
            if (!err) {
                reply(obj);
            } else {
                errorCallback(err, reply);
            }
        });
    },
    /**
     * @name Controller:Sliders.show
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for listing the sliders from the Slider model
     * returns {object} object
     **/
    show: function (req, reply) {
        var query = {
            $or: [{slug: req.params.id}]
        };

        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({_id: req.params.id});
        }
        findSlider(query)
            .then(function (slider) {
                if (!slider) {
                    reply(Hapi.error.notFound());
                } else {
                    reply(slider);
                }
            })
            .fail(errorCallback);
    },
    /**
     * @name Controller:Sliders.update
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for updating the slider record in the Slider model
     * returns {object} object
     **/
    update: function (req, reply) {
        findSlider({_id: req.params.id})
            .then(function (slider) {
                if (!slider) {
                    reply(Hapi.error.notFound());
                    return;
                }
                slider.attrAccessible.forEach(function (attr) {
                    if (req.payload.position === null) {
                        slider.public = false;
                    }

                    if (req.payload[attr] !== null) {
                        slider[attr] = req.payload[attr];
                    }
                });

                slider.save(function (err, updated) {
                    if (err) {
                        return reply(reformatErrors(err));
                    }
                    reply(updated);
                });
            })
            .fail(errorCallback);

    },
    /**
     * @name Controller:Sliders.delete
     * @function
     * @param {object} req - Request object
     * @param {interface} reply - hapi reply interface
     * @description Used for removing the slider based on the slider Id from the Slider model
     * returns {object} object
     **/
    delete: function (req, reply) {
        findSlider({_id: req.params.id})
            .then(function (slider) {
                if (!slider) {
                    return reply(Hapi.error.notFound());
                }

                slider.remove(function (err, project) {
                    if (err) {
                        return errorCallback(err);
                    }
                    reply({status: 'ok'});
                });
            })
            .fail(errorCallback);
    }
};
