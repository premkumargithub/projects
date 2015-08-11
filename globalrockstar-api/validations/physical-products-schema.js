/**
*   Defined the reuired schema for physical product APIs
*/
var Joi = require('joi') ;

module.exports.createPhysicalProductsSchema = Joi.object({
    artist: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required().max(140),
    price: Joi.number().required(),
    type: Joi.string().required(),
    predefined: Joi.boolean().required(),
    stock_handling: Joi.number().required(),
    shipping_included: Joi.boolean().required(),
    ppId: Joi.number().optional()
}).options({abortEarly: false});

