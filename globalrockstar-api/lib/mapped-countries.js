'use strict';

/**
 * @module Lib:mapped-countries
 *
 * @description Export countries metadata
 *
 */

var countriesMapping = require('../public/configs/countries.json');
var countries = {};
countriesMapping.forEach(function (c) {
    countries[c.code] = c.name;
});

module.exports = countries;
