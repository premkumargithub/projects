'use strict';
/**
 *   Provides routes for projects ralated activities.
 *   @module Routes:Projects-Route
 *   @requires module:hapi
 *   @requires module:../models/artist
 *   @requires module:../lib/pre-search-query
 *   @requires module:../lib/pre-paginator
 *   @requires module:../lib/pre-sorter
 *   @requires module:../controllers/projects
 */
var Hapi = require('hapi'),
    Artist = require('../models/artist'),
    preSearchQuery = require('../lib/pre-search-query'),
    prePaginator = require('../lib/pre-paginator'),
    preSorter = require('../lib/pre-sorter'),
    ProjectsController = require('../controllers/projects');

module.exports = function (server) {
    var preConfig = [{
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
     *   @event
     *   @name Routes:Projects-Route.Get-Projects
     *   @description <p>path: /projects </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: GET</p>
     *   <p> summary: Should return projects list for which are not deleted</p>
     *   @fires ProjectsController.index
     *   @returns {Object} Projects objects<br><br><hr>
     **/
    server.route([{
        method: 'GET',
        path: '/projects',
        config: {
            pre: [prePaginator, preSorter, preSearchQuery],
            handler: ProjectsController.index
        }
    },
    /**
     *   @event
     *   @name Routes:Projects-Route.Get-Project
     *   @description <p>path: /projects/{id} </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: GET</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> summary: Get particular project for admin user</p>
     *   @fires ProjectsController.byId
     *   @returns project object for admin request<br><br><hr>
     **/
        {
            method: 'GET',
            path: '/projects/{id}',
            config: {
                handler: ProjectsController.byId
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Update-Project
     *   @description <p>path: /projects/{id} </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> summary: Update particular project for admin user</p>
     *   @fires ProjectsController.update
     *   @returns Update object for admin request<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/projects/{id}',
            config: {
                handler: ProjectsController.update
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Set-state-Project
     *   @description <p>path: /projects/{id}/state/{state} </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> summary: Set project state as
     *     "publish-pending" or "completed" or "published" or "expired" or "created"</p>
     *   @fires ProjectsController.setState
     *   @returns project object with updated state<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/projects/{id}/state/{state}',
            config: {
                handler: ProjectsController.setState
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Mark-As-Delete-Project
     *   @description <p>path: /projects/{id}/mark-deleted </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> Summary: Mark as delete a project</p>
     *   @fires ProjectsController.markDeleted
     *   @returns Error/Success code <br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/projects/{id}/mark-deleted',
            config: {
                handler: ProjectsController.markDeleted
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Mark-As-Delete-Project
     *   @description <p>path: /projects/{id}/revive </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> Summary: Remove delete mark from a project</p>
     *   @fires ProjectsController.revive
     *   @returns Error/Success code <br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/projects/{id}/revive',
            config: {
                handler: ProjectsController.revive
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Delete-Project
     *   @description <p>path: /projects/{id} </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: DELETE</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> summary: Delete particular project</p>
     *   @fires ProjectsController.delete
     *   @returns Error/Success code <br><br><hr>
     **/
        {
            method: 'DELETE',
            path: '/projects/{id}',
            config: {
                handler: ProjectsController.delete
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Publish-Project-State
     *   @description <p>path: /projects/{projectId}/publish </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> summary: Set project state as "publish"</p>
     *   @fires ProjectsController.publish
     *   @returns project object with updated state<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/projects/{projectId}/publish',
            config: {
                handler: ProjectsController.publish
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Deny-Publish-Project
     *   @description <p>path: /projects/{projectId}/deny-publish </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.projectId</li>
     *   </ul>
     *   <p> Summary: Stop user to "publish" a project</p>
     *   @fires ProjectsController.denyPublish
     *   @returns project object<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/projects/{projectId}/deny-publish',
            config: {
                handler: ProjectsController.denyPublish
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.On-Off-Publish-Feature
     *   @description <p>path: /projects/{projectId}/feature/{onOff} </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> projectId: req.params.projectId</li>
     *   <li> onOff: req.params.onOff</li>
     *   </ul>
     *   <p> Summary: Mark onoff => true/false projects feature</p>
     *   @fires ProjectsController.denyPublish
     *   @returns project object<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/projects/{projectId}/feature/{onOff}',
            config: {
                handler: ProjectsController.faeture
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Get-Artist-Projects
     *   @description <p>path: /artists/{artistId}/projects/{projectId?} </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: GET</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> artistId: req.params.artistId</li>
     *   <li> projectId: req.params.id => optional for project details</li>
     *   </ul>
     *   <p> summary: Return artist's project items or specific project details</p>
     *   @fires ProjectsController.byArtistId
     *   @returns projects list or particular project<br><br><hr>
     **/
        {
            method: 'GET',
            path: '/artists/{artistId}/projects/{projectId?}',
            config: {
                pre: preConfig,
                handler: ProjectsController.byArtistId
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Activate-Artist-Project
     *   @description <p>path: /artists/{artistId}/projects/{projectId}/activate </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> artistId: req.params.artistId</li>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> summary: Used to activate the project
     *   Note: Only one active project allowed per artist at a given moment</p>
     *   @fires ProjectsController.activate
     *   @returns project object after update project<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/artists/{artistId}/projects/{projectId}/activate',
            config: {
                pre: preConfig,
                handler: ProjectsController.activate
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Deactivate-Artist-Project
     *   @description <p>path: /artists/{artistId}/projects/{projectId}/deactivate </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: PUT</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> artistId: req.params.artistId</li>
     *   <li> projectId: req.params.id</li>
     *   </ul>
     *   <p> summary: Used to deactivate the project</p>
     *   @fires ProjectsController.deactivate
     *   @returns project object after update project<br><br><hr>
     **/
        {
            method: 'PUT',
            path: '/artists/{artistId}/projects/{projectId}/deactivate',
            config: {
                pre: preConfig,
                handler: ProjectsController.deactivate
            }
        },
    /**
     *   @event
     *   @name Routes:Projects-Route.Create-Project
     *   @description <p>path: /artists/{artistId}/projects </p>
     *   <p><b>operations:</b></p>
     *   <p>- httpMethod: POST</p>
     *   <p>  parameters:</p>
     *   <ul>
     *   <li> artistId: req.params.artistId</li>
     *   </ul>
     *   <p> summary: Update particular project for admin user</p>
     *   <p> Request object: req.payload</p>
     *   <p> {"title":"My test project"
    *       "category":"category1",
    *       "description":"This is my test project", //optional
    *       "moneyToRaise":"600",
    *       "teaserImage":"some/crazy/path",
    *       "defaultReward":"55a7b42cf087308a533157f3" //optional
    *       "rewards": ["Free song", "Free Download", "CD", "CD plus T-Shirt", "New Car!"]} </p>
     *   @fires ProjectsController.update
     *   @returns Update object for admin request<br><br><hr>
     **/
        {
            method: 'POST',
            path: '/artists/{artistId}/projects',
            config: {
                pre: preConfig,
                handler: ProjectsController.create
            }
        }
    ]);
};
