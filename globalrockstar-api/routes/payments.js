'use strict';
/**
 * Provides routes for payment ralated activities.
 *
 * @module Routes:Payments-Route
 * @requires module:hapi
 * @requires module:../models/artist
 * @requires module:../controllers/payments
 * @requires module:../controllers/paypal
 * @requires module:joi
 */
var Hapi = require('hapi'),
    Artist = require('../models/artist'),
    pmtController = require('../controllers/payments'),
    ppController = require('../controllers/paypal');

module.exports = function (server) {
    //TODO: Unused should be remove it
    var preConfigArtistId = [{
        method: function (req, next) {
            Artist.findOne({
                _id: req.params.artistId
            }, function (err, artist) {
                if (artist) {
                    return next(null, artist);
                }
                next(null, Hapi.error.notFound());
            });
        },
        assign: 'artist'
    }];

    /**
     * @event
     * @name Routes:Payments-Route.Get-Artists-Payments
     * @description <p>path: /artists/{artistId}/payments </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * </ul>
     * <p> summary: Get Artists related payments results</p>
     * @fires pmtController.listArtistsPayments
     * @returns Payments result for artists request<br><br><hr>
     **/
    server.route([{
        method: 'GET',
        path: '/artists/{artistId}/payments',
        config: {
            handler: pmtController.listArtistsPayments
        }
    },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Artists-Payments
     * @description <p>path: /artists/{artistId}/payments/pending-mobile-vote-transfers </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * </ul>
     * <p> summary: Get Artists related pending payment from mobile results</p>
     * @fires pmtController.listArtistPendingMobileVoteTransfers
     **/
        {
            method: 'GET',
            path: '/artists/{artistId}/payments/pending-mobile-vote-transfers',
            config: {
                handler: pmtController.listArtistPendingMobileVoteTransfers
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Mobile-Vote-Payments
     * @description <p>path: /artists/{artistId}/payments/pending-mobile-vote-transfers </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * </ul>
     * <p> summary: Get Artists related pending payment from mobile results</p>
     * @fires pmtController.listArtistPendingMobileVoteTransfers
     **/
        {
            method: 'PUT',
            path: '/artists/{artistId}/payments/transfer-mobile-vote-payments',
            config: {
                handler: pmtController.transferMobileVotePendingPayments
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Valid-Paypal
     * @description <p>path: /payments/validate-paypal-account </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: POST</p>
     * <p> summary: Get valid paypal accounts</p>
     * @fires ppController.getAccountVerified
     **/
        {
            method: 'POST',
            path: '/payments/validate-paypal-account',
            config: {
                handler: ppController.getAccountVerified
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Valid-paypal-Currency-Acceptable
     * @description <p>path: /payments/validate-paypal-account-accepts-currency </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: POST</p>
     * <p> summary: Get valid paypal accounts which accepts the currency </p>
     * @fires ppController.getAcceptsCurrency
     **/
        {
            method: 'POST',
            path: '/payments/validate-paypal-account-accepts-currency',
            config: {
                handler: ppController.getAcceptsCurrency
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Default-Currency-Guess
     * @description <p>path: /payments/validate-paypal-account-guess-default-currencies </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: POST</p>
     * <p> summary: Gets the list for default currency guess payments </p>
     * @fires ppController.listProjectPayments
     **/
        {
            method: 'POST',
            path: '/payments/validate-paypal-account-guess-default-currencies',
            config: {
                handler: ppController.getDefaultCurrencyGuess
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-Payments-List
     * @description <p>path: /payments/projects/{projectId} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> projectId: req.params.projectId</li>
     * </ul>
     * <p> summary: Gets the list for project payments </p>
     * @fires ppController.listProjectPayments
     **/
        {
            method: 'GET',
            path: '/payments/projects/{projectId}',
            config: {
                handler: pmtController.listProjectPayments
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Download-Payment-CSV
     * @description <p>path: /artists/{artistId}/projects/{projectId}/csv-download </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * <li> projectId: req.params.projectId</li>
     * </ul>
     * <p> summary: Download the CSV for project payments </p>
     * @fires ppController.projectPaymentsCsvDownload
     **/
        {
            method: 'GET',
            path: '/artists/{artistId}/projects/{projectId}/csv-download',
            config: {
                handler: pmtController.projectPaymentsCsvDownload
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Create-Paypal-Payment
     * @description <p>path: /payments/{sourceType}/{sourceId}/{targetType}/{targetId}/{amount}/create </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: POST</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> sourceType: req.params.sourceType</li>
     * <li> targetType: req.params.targetType</li>
     * <li> targetId: req.params.targetId</li>
     * <li> amount: req.params.amount</li>
     * </ul>
     * <p> summary: Create the payment</p>
     * @fires ppController.createPayment
     **/
        {
            method: 'POST',
            path: '/payments/{sourceType}/{sourceId}/{targetType}/{targetId}/{amount}/create',
            config: {
                handler: pmtController.createPayment
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Check-Foreign-Currency
     * @description <p>path: /payments/{artistId}/{targetType}/{data}/check-foreign-currency </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * <li> targetType: req.params.targetType</li>
     * <li> data: req.params.data</li>
     * </ul>
     * <p> summary: Checks foreign currency for artists fans</p>
     * @fires ppController.checkForeignCurrency
     **/
        {
            method: 'GET',
            path: '/payments/{artistId}/{targetType}/{data}/check-foreign-currency',
            config: {
                handler: pmtController.checkForeignCurrency
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Commit-Paypal-Payment
     * @description <p>path: /payments/{paymentId}/abort </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> paymentId: req.params.paymentId</li>
     * </ul>
     * <p> summary: Commit the paypal payment flow </p>
     * @fires ppController.commitPayment
     **/
        {
            method: 'PUT',
            path: '/payments/{paymentId}/commit',
            config: {
                handler: pmtController.commitPayment
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Abort-Paypal-Payment
     * @description <p>path: /payments/{paymentId}/abort </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> paymentId: req.params.paymentId</li>
     * </ul>
     * <p> summary: Aborts the paypal payment flow </p>
     * @fires ppController.abortPayment
     **/
        {
            method: 'PUT',
            path: '/payments/{paymentId}/abort',
            config: {
                handler: pmtController.abortPayment
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Start-Paypal-Payment
     * @description <p>path: /payments/{paymentId}/init-paypal-flow </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> paymentId: req.params.paymentId</li>
     * </ul>
     * <p> summary: Starts paypal payment flow </p>
     * @fires ppController.initPayPalFlow
     **/
        {
            method: 'PUT',
            path: '/payments/{paymentId}/init-paypal-flow',
            config: {
                handler: ppController.initPayPalFlow
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-IPN-Payments
     * @description <p>path: /payments/{paymentId}/finish-paypal-flow </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> paymentId: req.params.paymentId</li>
     * </ul>
     * <p> summary: Finish the payment process flow </p>
     * @fires ppController.finishPayPalFlow
     **/
        {
            method: 'PUT',
            path: '/payments/{paymentId}/finish-paypal-flow',
            config: {
                handler: ppController.finishPayPalFlow
            }
        },
    /**
     * @event
     * @name Routes:Payments-Route.Get-IPN-Payments
     * @description <p>path: /payments/ipn </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: POST</p>
     * <p> summary: Get IPN payment list for the admin section </p>
     * @fires ppController.finishPayPalFlowIPN
     **/
        {
            method: 'POST',
            path: '/payments/ipn',
            config: {
                handler: ppController.finishPayPalFlowIPN
            }
        }]);
};
