/**
*   Defined the create comments schema validations 
*/
var Joi = require('joi') ;

module.exports.createCommentSchema = Joi.object({
    artistId: Joi.string().required(),
    userId: Joi.string().required(),
    userType: Joi.string().required(),
    message: Joi.string().required(),
    country: Joi.string().required()
}).options({abortEarly: false});

module.exports.commentReplySchema = Joi.object({
    userId: Joi.string().required(),
    userType: Joi.string().required(),
    message: Joi.string().required()
}).options({abortEarly: false});

module.exports.likeCommentSchema = Joi.object({
    userId: Joi.string().required()
}).options({abortEarly: false});

module.exports.likeReplySchema = Joi.object({
    userId: Joi.string().required()
}).options({abortEarly: false});

module.exports.commentFlagSchema = Joi.object({
    userId: Joi.string().required(),
    type: Joi.string().required()
}).options({abortEarly: false});
