'use strict';
/**
 * Provides routes for Vouchers ralated activities for Admin user.
 *
 * @module Routes:Vouchers-Route
 * @requires module:../lib/pre-search-query
 * @requires module:../lib/pre-load-user
 * @requires module:../lib/pre-load-model
 * @requires module:../controllers/vouchers
 */
var preSearchQuery = require('../lib/pre-search-query'),
    preLoadUser = require('../lib/pre-load-user'),
    loadModel = require('../lib/pre-load-model'),
    VoucherController = require('../controllers/vouchers');

module.exports = function (server) {
    /**
     * @event
     * @name Routes:Vouchers-Route.Get-Voucher-Templates
     * @description <p>path: /voucher-templates </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p> summary: Loads the voucher template</p>
     **/
    server.route([{
        method: 'GET',
        path: '/voucher-templates',
        config: {
            description: 'List all voucher templates',
            handler: loadModel('voucher-template')
        }
    },
    /**
     * @event
     * @name Routes:Vouchers-Route.Get-Voucher-Active-Templates
     * @description <p>path: /voucher-templates/active </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p> summary: Loads the active voucher template</p>
     * @fires VoucherController.admins-active
     **/
        {
            method: 'GET',
            path: '/voucher-templates/active',
            config: {
                description: 'List all active voucher templates',
                handler: VoucherController.admins.active
            }
        },
    /**
     * @event
     * @name Routes:Vouchers-Route.Create-Voucher-Template
     * @description <p>path: /voucher-templates </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: POST</p>
     * <p> summary: Creates a new voucher template</p>
     * @fires VoucherController.admins-create
     **/
        {
            method: 'POST',
            path: '/voucher-templates',
            config: {
                description: 'Create a new voucher template',
                handler: VoucherController.admins.create
            }
        },
    /**
     * @event
     * @name Routes:Vouchers-Route.Get-Voucher-Template
     * @description <p>path: /voucher-templates/{id} </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> VouchertemplateId: req.params.id</li>
     * </ul>
     * <p> summary: Gets a specific voucher template</p>
     * @fires VoucherController.loadModel
     **/
        {
            method: 'GET',
            path: '/voucher-templates/{id}',
            config: {
                description: 'Show a voucher template',
                handler: loadModel('voucher-template', 'id')
            }
        },
    /**
     * @event
     * @name Routes:Vouchers-Route.Active-Voucher-Template
     * @description <p>path: /voucher-templates/{id}/activate </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> VouchertemplateId: req.params.id</li>
     * </ul>
     * <p> summary: Gets a specific voucher template and assign to Voucher</p>
     * @fires VoucherController.admins-activate
     **/
        {
            method: 'PUT',
            path: '/voucher-templates/{id}/activate',
            config: {
                description: 'activate the voucher template',
                pre: [{
                    method: loadModel('voucher-template', 'id'),
                    assign: 'voucher'
                }],
                handler: VoucherController.admins.activate
            }
        },
    /**
     * @event
     * @name Routes:Vouchers-Route.Active-Voucher-Template
     * @description <p>path: /voucher-templates/{id}/deactivate </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> VouchertemplateId: req.params.id</li>
     * </ul>
     * <p> summary: Deactivate the voucher template</p>
     * @fires VoucherController.admins-deactivate
     **/
        {
            method: 'PUT',
            path: '/voucher-templates/{id}/deactivate',
            config: {
                description: 'deactivate the voucher template',
                pre: [{
                    method: loadModel('voucher-template', 'id'),
                    assign: 'voucher'
                }],
                handler: VoucherController.admins.deactivate
            }
        }]);

    ['artist', 'fan'].forEach(function (userType) {
        /**
         * @event
         * @name Routes:Vouchers-Route.Get-Active-Vouchers
         * @description <p>path: '/' + userType + 's/{userId}/vouchers </p>
         * <p><b>operations:</b></p>
         * <p>- httpMethod: GET</p>
         * <p>  parameters: </p>
         * <ul>
         * <li> userType: userType</li>
         * <li> userId: req.params.userId</li>
         * </ul>
         * <p> summary: Gets all the vouchers for auser </p>
         * @fires VoucherController.users-index
         **/
        server.route([{
            method: 'GET',
            path: '/' + userType + 's/{userId}/vouchers',
            config: {
                description: 'Get all vouchers of a user',
                pre: [
                    preSearchQuery
                ],
                handler: VoucherController.users(userType).index
            }
        },
        /**
         * @event
         * @name Routes:Vouchers-Route.Get-Active-Vouchers
         * @description <p>path: '/' + userType + 's/{userId}/vouchers/{packageId}/
         * artist/{artistId} </p>
         * <p><b>operations:</b></p>
         * <p>- httpMethod: POST</p>
         * <p>  parameters: </p>
         * <ul>
         * <li> userType: userType</li>
         * <li> userId: req.params.userId</li>
         * <li> packageId: req.params.packageId</li>
         * <li> artistId: req.params.artistId</li>
         * </ul>
         * <p> summary: Create a new voucher, payload has to include a valid
         * voucher template id</p>
         * @fires VoucherController.users-create
         **/
            {
                method: 'POST',
                path: '/' + userType + 's/{userId}/vouchers/{packageId}/artist/{artistId}',
                config: {
                    description: 'Create a new voucher, payload has to include a valid voucher template id',
                    pre: [
                        [{
                            method: preLoadUser(userType),
                            assign: 'user'
                        }, {
                            method: loadModel('voucher-template', 'packageId'),
                            assign: 'template'
                        }]
                    ],
                    handler: VoucherController.users(userType).create
                }
            },
        /**
         * @event
         * @name Routes:Vouchers-Route.Get-Active-Vouchers
         * @description <p>path: '/' + userType + 's/{userId}/vouchers/active/{artistId?} </p>
         * <p><b>operations:</b></p>
         * <p>- httpMethod: GET</p>
         * <p>  parameters: </p>
         * <ul>
         * <li> userType: userType</li>
         * <li> userId: req.params.userId</li>
         * <li> artistId: req.params.artistId</li>
         * </ul>
         * <p> summary: Gets the active voucher list</p>
         * @fires VoucherController.users-active
         **/
            {
                method: 'GET',
                path: '/' + userType + 's/{userId}/vouchers/active/{artistId?}',
                config: {
                    description: 'Lists the active vouchers',
                    handler: VoucherController.users(userType).active
                }
            },
        /**
         * @event
         * @name Routes:Vouchers-Route.Check-Vocher-Left
         * @description <p>path: '/' + userType + 's/{userId}/vouchers/has-active/{artistId} </p>
         * <p><b>operations:</b></p>
         * <p>- httpMethod: GET</p>
         * <p>  parameters: </p>
         * <ul>
         * <li> userType: userType</li>
         * <li> userId: req.params.userId</li>
         * <li> artistId: req.params.artistId</li>
         * </ul>
         * <p> summary: Determines if the user has vouchers left for an artist</p>
         * @fires VoucherController.users-hasActive
         **/
            {
                method: 'GET',
                path: '/' + userType + 's/{userId}/vouchers/has-active/{artistId}',
                config: {
                    description: 'Determines if the user has vouchers left for the artist',
                    handler: VoucherController.users(userType).hasActive
                }
            },
        /**
         * @event
         * @name Routes:Vouchers-Route.Check-Voucher-Expire
         * @description <p>path: '/' + userType + 's/{userId}/vouchers/{id}/activate </p>
         * <p><b>operations:</b></p>
         * <p>- httpMethod: PUT</p>
         * <p>  parameters: </p>
         * <ul>
         * <li> userType: userType</li>
         * <li> userId: req.params.userId</li>
         * </ul>
         * <p> summary: Use the voucher that will be expired</p>
         * @fires VoucherController.users-use
         **/
            {
                method: 'PUT',
                path: '/' + userType + 's/{userId}/vouchers/use',
                config: {
                    description: 'Use the voucher that will expire next<br/>returns the used voucher with the new count',
                    handler: VoucherController.users(userType).use
                }
            },
        /**
         * @event
         * @name Routes:Vouchers-Route.Activate-Voucher-On_payment
         * @description <p>path: '/' + userType + 's/{userId}/vouchers/{id}/activate </p>
         * <p><b>operations:</b></p>
         * <p>- httpMethod: GET</p>
         * <p>  parameters: </p>
         * <ul>
         * <li> userType: userType</li>
         * <li> userId: req.params.userId</li>
         * <li> voucherId: req.params.id</li>
         * </ul>
         * <p> summary: Activate the voucher when the payment is completed</p>
         * @fires VoucherController.users-activate
         **/
            {
                method: 'PUT',
                path: '/' + userType + 's/{userId}/vouchers/{id}/activate',
                config: {
                    description: 'Activate the voucher when the payment is completed',
                    pre: [
                        [{
                            method: preLoadUser(userType),
                            assign: 'user'
                        }, {
                            method: loadModel('voucher', 'id'),
                            assign: 'voucher'
                        }]
                    ],
                    handler: VoucherController.users(userType).activate
                }
            }]);
    });
    /**
     * @event
     * @name Routes:Vouchers-Route.Get-Voucher-Count-To-Artist
     * @description <p>path: /artists/{userId}/consumed-users-vouchers/count </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters: </p>
     * <ul>
     * <li> UserId: req.params.userId</li>
     * </ul>
     * <p> summary: Gets all used vouchers for an artist user</p>
     * @fires VoucherController.artists-usedVouchersCount
     **/
    server.route([{
        method: 'GET',
        path: '/artists/{userId}/consumed-users-vouchers/count',
        config: {
            description: 'Get all used voucher counts for an artist',
            handler: VoucherController.artists.usedVouchersCount
        }
    },
    /**
     * @event
     * @name Routes:Vouchers-Route.Get-Vouchers-To-Artist
     * @description <p>path: /artists/{userId}/consumed-users-vouchers/{contestId} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters: </p>
     * <ul>
     * <li> UserId: req.params.userId</li>
     * <li> contestId: req.params.contestId</li>
     * </ul>
     * <p> summary: Gets all the vouchers for an artist user</p>
     * @fires VoucherController.artists-usedVouchers
     **/
        {
            method: 'GET',
            path: '/artists/{userId}/consumed-users-vouchers/{contestId}',
            config: {
                description: 'Get all vouchers for an artist',
                handler: VoucherController.artists.usedVouchers
            }
        }]);
};
