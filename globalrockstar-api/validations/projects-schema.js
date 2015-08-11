/**
 *	Defined projects API payload validation schema here
 */
var Joi = require('joi') ;

// Define create projects API schema validation
module.exports.createProjectsSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    releaseDate: Joi.date().required(),
    moneyToRaise: Joi.number().integer().min(250).max(2500),
    teaserImage: Joi.string().required(),
    teaserVideo: Joi.string().required(),
    category: Joi.string().required(),
    rewards: Joi.array().required()
}).options({abortEarly: false});

