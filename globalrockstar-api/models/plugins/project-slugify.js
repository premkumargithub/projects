'use strict';

var slug = require('slug');
var uuid = require('node-uuid');
var Q = require('q');

/* Project Slugify - based on Mongoose Slugify
 *
 * uses a prefixFetcher to dynmically resolve a comon prefix for the slugs
 * updates the slug on every save
 *
 * Usage:
 *
 * var slugify = require('mongoose-slugify');
 * Model.plugin(slugify, { prop: 'title' }) ;
 *
 * Options:
 * - prop: property to slugify (mandatory!)
 * - softdelete: mongoose schema uses softdelete to trash records (default: nope)
 * - delimiter: delimiter used in slugs (default: "-")
 * - index: yup (default: nope)
 * - slugField: slug-field-name (default: slug)
 * - position: 'pre' or 'post (default: 'post')
 * - prefixFetcher: promis returning a 'string' used to prefix the slug
 */

module.exports = function mongooseSlugify(schema, options) {

    if (options.prop === undefined) {
        throw new Error('prop must be defined');
    }

    if (options.position === undefined) {
        options.position = 'post';
    }

    if (options.softdelete === undefined) {
        options.softdelete = false;
    }

    if (options.slugField === undefined) {
        options.slugField = 'slug';
    }

    if (options.delimiter === undefined) {
        options.delimiter = '-';
    }

    if (!options.prefixFetcher) {
        options.prefixFetcher = function () {
            return new Q('');
        };
    }

    var slugProperty = {};
    slugProperty[options.slugField] = {
        type: String,
        unique: true,
        index: true
    };

    schema.add(slugProperty);

    var slugWithNumber = function (value, count) {
        var slug;
        if (options.position === 'pre') {
            slug = '' + count + options.delimiter + value;
        } else {
            slug = value + options.delimiter + count;
        }

        return slug.toLocaleLowerCase();
    };

    schema.pre('save', function (next) {
        var self = this;

        if (options.lowercase) {
            self[options.prop] = self[options.prop].toLocaleLowerCase();
        }

        options.prefixFetcher.call(this)
            .then(function (slugPrefix) {
                self[options.slugField] = slugPrefix + options.delimiter + slug(self[options.prop].replace(/\'/g, ''), options.delimiter).toLocaleLowerCase();
                if (self[options.slugField] === null || self[options.slugField].length === 0) {
                    self[options.slugField] = uuid.v4();
                }

                var query = {};

                query[options.slugField] = new RegExp(self[options.slugField] + '*');
                query._id = {
                    $ne: self._id
                };

                if (options.softdelete) {
                    self.constructor.count(query, function (err, c) {
                        if (c > 0) {
                            self[options.slugField] = slugWithNumber(self[options.slugField], (c + 1));
                        }
                        next();
                    });

                } else {
                    self.constructor.find(query).sort('-' + options.slugField).exec(function (err, objs) {
                        if (objs.length !== 0) {
                            var count = parseInt(objs[0][options.slugField].split(options.delimiter).slice(-1)[0]);
                            if (Number.isNaN(count)) {
                                count = 1;
                            }
                            self[options.slugField] = slugWithNumber(self[options.slugField], (count + 1));
                        }
                        next();
                    });
                }

            })
            .fail(function (err) {
                next(err);
            });
    });
};
