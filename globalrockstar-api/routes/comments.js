'use strict';
/**
*   @module Routes:Comments
*   @description Provides routes for CRUD feature to comments on the artist's profile
*   @requires module:../controllers/comments
*   @requires module:pretty-hapi-errors
*   @requires module:../validations/comment-schema
*
*/

var CommentController = require('../controllers/comments'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    commentSchema = require('../validations/comment-schema');

module.exports = function (server) {
    server.route([
        /**
        *   @event
        *   @name Routes:Comments.Add-Comment
        *   @description <p>path: /comments </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add the comment for an artist </p>
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0",
        *       "artistId":"55911b5b6bcd0e881c3178c0",
        *       "userType":"fan or artist"
        *       "country":"IN",
        *       "message":"Hello comment!!"} </p>
        *   @fires CommentController.create
        *   @returns The comment object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/comments',
            config: {
                description: 'Add new comment on the artist profile',
                handler: CommentController.create,
                validate: {
                    payload: commentSchema.createCommentSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Delete-Comment
        *   @description <p>path: /comments/{commentId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: DELETE</p>
        *   <p> summary: Delete main comment from artist profile</p>
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   </ul>   
        *   @fires CommentController.deleteComment
        *   @returns The comments objects <br><br><hr>
        **/
        {
            method: 'DELETE',
            path: '/comments/{commentId}',
            config: {
                description: 'Delete a comment by an user on artist profile',
                handler: CommentController.deleteComment
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Get-Comments
        *   @description <p>path: /comments/{artistId}/{country?} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Search the comments for an artist </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> ArtistID: req.params.artistId</li>
        *   <li> countryCode: req.query.country - Optional</li>
        *   <li> continentCode: req.query.continent - Optional</li>
        *   <li> start: req.query.start - Optional</li>
        *   <li> end: req.query.end - Optional</li>
        *   </ul>         
        *   @fires CommentController.index
        *   @returns The comments objects <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/comments/{artistId}',
            config: {
                description: 'Get comments list for an artist profile',
                handler: CommentController.index
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Like-On-Comment
        *   @description <p>path: /comments/like/{userId}/{commentId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add the like to comment for an artist </p>  
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   </ul>    
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0"}   
        *   @fires CommentController.like
        *   @returns The updated comment object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/comments/{commentId}/likes',
            config: {
                description: 'Like a comment by other user on artist profile',
                handler: CommentController.like,
                validate: {
                    payload: commentSchema.likeCommentSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Unlike-On-Comment
        *   @description <p>path: /comments/{commentId}/likes/{userId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: DELETE</p>
        *   <p> summary: Remove the like from comment for an artist </p>  
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   <li> userId: req.params.userId</li>
        *   </ul>       
        *   @fires CommentController.unLike
        *   @returns success/error object <br><br><hr>
        **/
        {
            method: 'DELETE',
            path: '/comments/{commentId}/likes/{userId}',
            config: {
                description: 'Unlike a comment by other user on artist profile',
                handler: CommentController.unLike
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Like-Reply-On-Comment
        *   @description <p>path: /comments/{commentId}/reply/{replyId}/likes </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add the like to comment reply for an artist </p>  
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   <li> replyId: req.params.replyId</li>
        *   </ul>    
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0"}   
        *   @fires CommentController.likeReply
        *   @returns The updated comment object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/comments/{commentId}/reply/{replyId}/likes',
            config: {
                description: 'Like a reply by other user on artist profile',
                handler: CommentController.likeReply,
                validate: {
                    payload: commentSchema.likeReplySchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Unlike-On-Reply
        *   @description <p>path: /comments/{commentId}/reply/{replyId}/likes/{userId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: DELETE</p>
        *   <p> summary: Remove the like from reply for an artist </p>  
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   <li> replyId: req.params.replyId</li>
        *   <li> userId: req.params.userId</li>
        *   </ul>       
        *   @fires CommentController.unLikeReply
        *   @returns The updated comment object <br><br><hr>
        **/
        {
            method: 'DELETE',
            path: '/comments/{commentId}/reply/{replyId}/likes/{userId}',
            config: {
                description: 'Unlike a reply by other user on artist profile',
                handler: CommentController.unLikeReply
            }
        },
        /**
        *
        *   @event
        *   @name Routes:Comments.Reply-On-Comments
        *   @description <p>path: /comments/{commentId}/replies </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add the reply to a comment for an artist </p>   
        *   <p>  parameters:</p>     
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   </ul>   
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0","userType":"fan or artist"
        *       "message":"Hello!!"} </p>
        *   @fires CommentController.replyOnComment
        *   @returns The updated comment objects <br><br><hr>
        */
        {
            method: 'POST',
            path: '/comments/{commentId}/replies',
            config: {
                description: 'Reply to a comment by other user on artist profile',
                handler: CommentController.replyOnComment,
                validate: {
                    payload: commentSchema.commentReplySchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Delete-Reply
        *   @description <p>path: /comments/{commentId}/replies/{replyId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: DELETE</p>
        *   <p> summary: Delete the reply from artist profile comment</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   <li> replyId: req.params.replyId</li>
        *   </ul>
        *   @fires CommentController.deleteReply
        *   @returns The updated comment object <br><br><hr>
        **/
        {
            method: 'DELETE',
            path: '/comments/{commentId}/replies/{replyId}',
            config: {
                description: 'Delete a reply by an user from artist profile',
                handler: CommentController.deleteReply
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Flag-On-Comments
        *   @description <p>path: /comments/{commentId}/flags </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add a flag to a comment for an artist </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   </ul>     
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0",
        *       "type":"fans or offence"} </p>
        *   @fires CommentController.flagComment
        *   @returns success/error object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/comments/{commentId}/flags',
            config: {
                description: 'Flag a comment by other user on artist profile',
                handler: CommentController.flagComment,
                validate: {
                    payload: commentSchema.commentFlagSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Flag-On-Reply
        *   @description <p>path: /comments/{commentId}/replies/{replyId}/flags </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> summary: Add a flag to a reply on comment for an artist </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> commentId: req.params.commentId</li>
        *   <li> replyId: req.params.replyId</li>
        *   </ul>     
        *   <p> Request object: req.payload</p>     
        *   <p> {"userId":"55911b5b6bcd0e881c3178c0",
        *       "type":"fans or offence"} </p>
        *   @fires CommentController.flagComment
        *   @returns success/error object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/comments/{commentId}/replies/{replyId}/flags',
            config: {
                description: 'Flag a comment by other user on artist profile',
                handler: CommentController.flagToReplyOnComment,
                validate: {
                    payload: commentSchema.commentFlagSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Comments.Get-Total-streams
        *   @description <p>path: /total/stream/{userId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> summary: Get comments and activity total counts for an user </p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> userId: req.params.userId</li>
        *   </ul>     
        *   @fires CommentController.getTotalStream
        *   @returns comment and activity streams <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/total/streams/{userId}',
            config: {
                description: 'Get comments and activity total for user',
                handler: CommentController.getTotalStream
            }
        }

    ]);
};
