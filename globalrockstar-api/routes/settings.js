'use strict';
/**
 * Provides routes for setting ralated activities in the admin portal
 *
 * @module Routes:Setting-Route
 * @requires module:../controllers/settings
 */
var SettingsController = require('../controllers/settings');

module.exports = function (server) {
    /**
    * @event
    * @name Routes:Setting.Get-Setting
    * @description <p>path: /settings </p>
    * <p><b>operations:</b></p>
    * <p>-  httpMethod: GET</p>
    * <p> summary: Provide seeting activity in the admin section</p>
    * @fires SettingsController.index
    * @returns renders the layout with options for the setting<br><br><hr>
    **/
    server.route({
        method: 'GET',
        path: '/settings',
        config: {
            handler: SettingsController.index
        }
    }) ;

    /**
    * @event
    * @name Routes:Setting-Route.PUT-Setting
    * @description <p>path: /settings </p>
    * <p><b>operations:</b></p>
    * <p>-  httpMethod: PUT</p>
    * <p> summary: Provide the action to update the setting for admin request</p>
    * @fires SearchController.preSetting
    **/
    server.route({
        method: 'PUT',
        path: '/settings',
        config: {
            handler: SettingsController.update,
            pre: SettingsController.preSetting
        }
    }) ;
};
