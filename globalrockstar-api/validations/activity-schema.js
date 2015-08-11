/**
*   Defined the create Activity schema validations 
*/
var Joi = require('joi') ;

module.exports.createActivitySchema = Joi.object({
    artistId: Joi.string().required(),
    activity: Joi.object().required(),
    country: Joi.string().required()
}).options({abortEarly: false});

module.exports.activityReplySchema = Joi.object({
    userId: Joi.string().required(),
    userType: Joi.string().required(),
    message: Joi.string().required()
}).options({abortEarly: false});

module.exports.activityFlagSchema = Joi.object({
    userId: Joi.string().required(),
    type: Joi.string().required()
}).options({abortEarly: false});
