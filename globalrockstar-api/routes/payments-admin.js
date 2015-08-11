'use strict';
/**
 * Provides routes for payments ralated activities for Admin user.
 *
 * @module Routes:Payments-Route
 * @requires module:../controllers/payments-admin
 */
var pmtController = require('../controllers/payments-admin');

module.exports = function (server) {
    /**
     * @event
     * @name Routes:Payments-Route.Get-Admin-Payments
     * @description <p>path: /admin/payments </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p> summary: Get payments for admin user</p>
     * @fires pmtController.index
     * @returns Payments result for admin request<br><br><hr>
     **/
    server.route([{
        method: 'GET',
        path: '/admin/payments',
        config: {
            handler: pmtController.index
        }
    },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Artists-Payments
     * @description <p>path: /admin/artists/{artistId}/payments </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> type: req.params.artistId</li>
     * </ul>
     * <p> summary: Get payments for admin user</p>
     * @fires pmtController.index
     * @returns Artists payment results for admin request<br><br><hr>
     **/
        {
            method: 'GET',
            path: '/admin/artists/{artistId}/payments',
            config: {
                handler: pmtController.index
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Admin-Payments
     * @description <p>path: /admin/payments/{id}
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> paymentId: req.params.id</li>
     * </ul>
     * <p> summary: Get specific payment result for admin user</p>
     * @fires pmtController.show
     * @returns Payment result for admin request<br><br><hr>
     **/
        {
            method: 'GET',
            path: '/admin/payments/{id}',
            config: {
                handler: pmtController.show
            }
        }]);
};
