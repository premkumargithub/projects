'use strict';
/**
 * @module Routes:media-libraries
 *
 * @description provide routes to get fans' and artists' media-library elements
 *
 */
var controller = require('../controllers/media-libraries');

module.exports = function (server) {
    // Get media library info about a specific artist or fan based on given {id}
    ['artist', 'fan'].forEach(function (type) {
        server.route([{
            method: 'GET',
            path: '/' + type + 's/{id}/media-library',
            config: {
                handler: controller(type).detail
            }
        }]);
    });
};
