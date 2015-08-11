var Joi = require('joi'),
    genres = require('../public/configs/genres.json'),
    states = require('../public/configs/states.json');

// Validation against the create command
module.exports.createSchema = Joi.object().keys({

    title: Joi.string().required(),
    genres: Joi.array().includes(Joi.string().valid(genres)).required(),

    artist: Joi.string().required(),

    price: Joi.number(),

    // Used only for internal reference
    gr_doc_ver: Joi.number().default(2),

    label: Joi.string(),
    upcCode: Joi.string(),
    publisher: Joi.string(),

    flagged_date: Joi.date(),
    flagged: Joi.boolean(),
    flagged_reason: Joi.string(),

    stars: Joi.number().integer().min(0).max(5).default(0),

    state: Joi.string().valid(states).default(states[0])

}).options({abortEarly: false, allowUnknown: true});


// Validation against the update command
module.exports.updateSchema = Joi.object({

    title: Joi.string().required(),
    genres: Joi.array().includes(Joi.string().valid(genres)).required(),

    price: Joi.number().required(),
    order: Joi.number().required(),

    state: Joi.string().valid(states).required()

}).options({abortEarly: false, allowUnknown: true});