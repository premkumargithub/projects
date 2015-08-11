'use strict';
/**
 * Provides routes for Voting-Packages ralated activities
 *
 * @module Routes:Voting-Packages-Route
 * @requires module:../lib/pre-search-query
 * @requires module:../lib/pre-load-user
 * @requires module:../lib/pre-load-model
 * @requires module:../controllers/voting-packages
 */
var loadModel = require('../lib/pre-load-model'),
    VotingPackagesController = require('../controllers/voting-packages');

module.exports = function (server) {
    /**
     * @event
     * @name Routes:Voting-Packages-Route.Get-Voting-Packages
     * @description <p>path: /artists/{artistId}/voting-packages/{contestId} </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * <li> contestId: req.params.contestId</li>
     * </ul>
     * <p> summary: Get all the voting packages for a contest </p>
     * @fires VotingPackagesController.indexContest
     **/
    server.route([{
        method: 'GET',
        path: '/artists/{artistId}/voting-packages/{contestId}',
        config: {
            description: 'List all voting packages for a contest',
            handler: VotingPackagesController.indexContest
        }
    },
    /**
     * @event
     * @name Routes:Voting-Packages-Route.Get-Voting-Packages
     * @description <p>path: /artists/{artistId}/voting-packages </p>
     * <p><b>operations:</b></p>
     * <p>-  httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * </ul>
     * <p> summary: Get all the voting template </p>
     * @fires VotingPackagesController.index
     **/
        {
            method: 'GET',
            path: '/artists/{artistId}/voting-packages',
            config: {
                description: 'List all voucher templates',
                handler: VotingPackagesController.index
            }
        },
    /**
     * @event
     * @name Routes:Voting-Packages-Route.Create-Voting-Package
     * @description <p>path: /artists/{artistId}/voting-packages/song </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: POST</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * </ul>
     * <p> summary: Create new voting package for a song </p>
     * @fires VotingPackagesController.create
     **/
        {
            method: 'POST',
            path: '/artists/{artistId}/voting-packages/song',
            config: {
                description: 'Create new voting package for song',
                handler: VotingPackagesController.create
            }
        },
    /**
     * @event
     * @name Routes:Voting-Packages-Route.Create-Voting-TemplatePackage
     * @description <p>path: /artists/{artistId}/voting-packages/{templateId} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: POST</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * <li> templateId: req.params.templateId</li>
     * </ul>
     * <p> summary: Create new voting package from a template </p>
     * @fires VotingPackagesController.create
     **/
        {
            method: 'POST',
            path: '/artists/{artistId}/voting-packages/{templateId}',
            config: {
                description: 'Create new voting package from template',
                pre: [{
                    method: loadModel('voucher-template', 'templateId'),
                    assign: 'template'
                }],
                handler: VotingPackagesController.create
            }
        },
    /**
     * @event
     * @name Routes:Voting-Packages-Route.Update-Voting-Package
     * @description <p>path: /artists/{artistId}/voting-packages/{id} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: PUT</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * <li> packageId: req.params.id</li>
     * </ul>
     * <p> summary: Update a voting package </p>
     * @fires handler: VotingPackagesController.update
     **/
        {
            method: 'PUT',
            path: '/artists/{artistId}/voting-packages/{id}',
            config: {
                description: 'Update a voting package',
                handler: VotingPackagesController.update
            }
        },
    /**
     * @event
     * @name Routes:Voting-Packages-Route.Update-Voting-Package
     * @description <p>path: /artists/{artistId}/voting-packages/{id} </p>
     * <p><b>operations:</b></p>
     * <p>- httpMethod: GET</p>
     * <p>  parameters:</p>
     * <ul>
     * <li> artistId: req.params.artistId</li>
     * <li> packageId: req.params.id</li>
     * </ul>
     * <p> summary: Delets a voting package </p>
     * @fires handler: VotingPackagesController.delete
     **/
        {
            method: 'delete',
            path: '/artists/{artistId}/voting-packages/{id}',
            config: {
                description: 'Create a new voting package',
                handler: VotingPackagesController.delete
            }
        }]);
};
