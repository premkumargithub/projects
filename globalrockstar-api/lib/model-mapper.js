/**
 * @module Lib:model-mapper
 *
 * @description Utility to update a model
 *
 * @requires module:./util
 */
var util = require('util');
var ModelMapper = function (source, opt) {
    this.source = source;
    this.opt = opt || {};
    this.opt.excludes = this.opt.excludes || ['id', '_id', 'slug'];
};

/**
 *
 * @param model
 */
// FIXME: This function is never used.
ModelMapper.prototype.to = function (model) {
    var self = this;
    model.schema.eachPath(function (key, path) {
        if (self.opt.includes) {
            if (self.opt.includes.indexOf(key) < 0) {
                return;
            }
        }

        if (self.opt.excludes.indexOf(key) >= 0) {
            return;
        }

        if (path.options.type == Boolean) {
            var valueRaw = self.source[key];

            if (key in self.source) {
                if (util.isArray(valueRaw)) {
                    valueRaw = valueRaw.pop();
                }
            }
            model.set(key, valueRaw == 'true' || valueRaw == '1' || valueRaw == 'on');
        } else if (key in self.source) {
            var value = self.source[key];
            model.set(key, value);
        }
    });
};

/**
 * Export a new instance of ModelMapper
 *
 * @param source
 * @param opt
 * @returns {ModelMapper}
 */
// FIXME: This function is never used.
module.exports.map = function (source, opt) {
    return new ModelMapper(source, opt);
};

/**
 * Update a mongoose instance according to the array of updatable fields
 *
 * @param {object} obj mongoose instance
 * @param {object} props properties to update
 * @param {array} safe array of properties which is possible to update
 * @param {Schema} schema mongoose schema
 */
module.exports.mapFields = function (modelInstance, payload, safeProperties, schema) {

    safeProperties.forEach(function (safeProperty) {
        if (payload.hasOwnProperty(safeProperty)) {
            modelInstance[safeProperty] = payload[safeProperty];
        }
    });

    if (schema) {
        // Normalize Booleans
        schema.eachPath(function (key, path) {
            if (safeProperties.indexOf(key) >= 0 && path.options.type == Boolean) {
                modelInstance[key] = payload[key] == 'true' || payload[key] == '1' || payload[key] == 'on';
            }
        });
    }
};
