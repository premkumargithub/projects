'use strict';

/**
 * @module Lib:is-true
 *
 * @description Utility to verify if a proposition is true
 *
 */

module.exports = function isTrue(prop) {
    return prop == 'true' || prop == '1' || prop == 'on';
};