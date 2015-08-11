'use strict';
/**
*   @module Routes:Activities
*   @description Provides routes for CRUD feature to activities on the artist's profile
*   @requires module:../controllers/activities
*   @requires module:pretty-hapi-errors
*   @requires module:../validations/activity-schema
*/

var ActivityController = require('../controllers/activities'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    activitySchema = require('../validations/activity-schema');

module.exports = function (server) {
    server.route([
        /**
        *   @event
        *   @name Routes:Activities.Add-Activity
        *   @description <p>path: /activities </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> Summary: Add the activity for an artist </p>
        *   <p> Request object: req.payload</p>     
        *   <p> {"artistId":"55911b5b6bcd0e881c3178c0"
        *       "country":"IN",
        *       "activity":{"type":"become_fan",
        *       "user":"55911b5b6bcd0e881c3178c0", "userType":"fan or artist"}} </p>
        *   @fires ActivityController.create
        *   @returns The activity object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/activities',
            config: {
                description: 'Add new activity on the artist profile',
                handler: ActivityController.create,
                validate: {
                    payload: activitySchema.createActivitySchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Activities.Get-Activities
        *   @description <p>path: /activities/{artistId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Search the activities for an artist </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> ArtistID: req.params.artistId</li>
        *   <li> countryCode: req.query.country- Optional</li>
        *   <li> continentCode: req.query.continent- Optional</li>
        *   <li> StarLimit: req.query.start - Optional</li>
        *   <li> Offset: req.query.end - Optional</li>
        *   </ul>         
        *   @fires ActivityController.index
        *   @returns The activity objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/activities/{artistId}',
            config: {
                description: 'Get activity list for an artist profile',
                handler: ActivityController.index
            }
        },
        /**
        *   @event
        *   @name Routes:Activities.Delete-Activity
        *   @description <p>path: /activities/{activityId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: DELETE</p>
        *   <p> Summary: Delete the activity for an artist </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> activityId: req.params.activityId</li>
        *   </ul> 
        *   @fires ActivityController.deleteActivity
        *   @returns success/error object <br><br><hr>
        **/
        {
            method: 'DELETE',
            path: '/activities/{activityId}',
            config: {
                description: 'Add new activity on the artist profile',
                handler: ActivityController.deleteActivity
            }
        },
        /**
        *   @event
        *   @name Routes:Activities.Reply-On-Activity
        *   @description <p>path: /activities/{activityId}/replies </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Reply on activity by an artist only for an artist </p>
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> activityId: req.params.activityId</li>
        *   </ul>   
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0",
        *       "userType":"artist or fan",
        *       "message":"Hello!!"} </p>
        *   </ul>         
        *   @fires ActivityController.replyOnActivity
        *   @returns The activity objects <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/activities/{activityId}/replies',
            config: {
                description: 'Reply on activity by an artist',
                handler: ActivityController.replyOnActivity,
                validate: {
                    payload: activitySchema.activityReplySchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Activities.Delete-Reply
        *   @description <p>path: /activities/{activityId}/replies/{replyId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: DELETE</p>
        *   <p> summary: Delete the reply from artist profile activity</p>
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> activityId: req.params.activityId</li>
        *   <li> replyId: req.params.replyId</li>
        *   </ul>   
        *   @fires ActivityController.deleteReply
        *   @returns success message <br><br><hr>
        **/
        {
            method: 'DELETE',
            path: '/activities/{activityId}/replies/{replyId}',
            config: {
                description: 'Delete a reply by an artist from artist profile',
                handler: ActivityController.deleteReply
            }
        },
        /**
        *   @event
        *   @name Routes:Activities.Flag-On-Activity
        *   @description <p>path: /activities/{activityId}/flags </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add a flag to a activity for an artist- Only by Admin </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> activityId: req.params.activityId</li>
        *   </ul>     
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0",
        *       "type":"fans or offence"} </p>
        *   @fires ActivityController.flagActivity
        *   @returns success/error object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/activities/{activityId}/flags',
            config: {
                description: 'Flag a activity by Admin user on artist profile',
                handler: ActivityController.flagActivity,
                validate: {
                    payload: activitySchema.activityFlagSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Activities.Flag-On-Reply
        *   @description <p>path: /activities/{activityId}/replies/{replyId}/flags </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add a flag to a reply on activity by admin an artist </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> activityId: req.params.activityId</li>
        *   <li> replyId: req.params.replyId</li>
        *   </ul>     
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0",
        *       "type":"fans or offence"} </p>
        *   @fires ActivityController.flagToReplyOnActivity
        *   @returns success/error object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/activities/{activityId}/replies/{replyId}/flags',
            config: {
                description: 'Flag a activity by admin user on artist profile',
                handler: ActivityController.flagToReplyOnActivity,
                validate: {
                    payload: activitySchema.activityFlagSchema,
                    failAction: PrettyHapiErrors
                }
            }
        }

    ]);
};
