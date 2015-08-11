var Joi = require('joi');

// Validation against the create command
module.exports.createYoutubeSchema = Joi.object().keys({

    title: Joi.string().required(),
    artist: Joi.string().required(),
    genres: Joi.array(),
    youtubeURL: Joi.string().required().regex(/^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/),
    originalSource: Joi.string().required(),

    // Used only for internal reference
    gr_doc_ver: Joi.number().default(2)


}).options({abortEarly: false, allowUnknown: true});


// Validation against the update command
module.exports.updateYoutubeSchema = Joi.object().keys({

    title: Joi.string().required(),
    genres: Joi.array(),
    youtubeURL: Joi.string().required().regex(/^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/),
    contest: Joi.string()


}).options({abortEarly: false, allowUnknown: true});


module.exports.createGlobalRockstarSchema = Joi.object().keys({

    title: Joi.string().required(),
    artist: Joi.string().required(),
    genres: Joi.array(),
    originalSource: Joi.string().required(),

    // Used only for internal reference
    gr_doc_ver: Joi.number().default(2)


}).options({abortEarly: false, allowUnknown: true});


// Validation against the update command
module.exports.updateGlobalrockstarSchema = Joi.object().keys({

    genres: Joi.array(),
    title: Joi.string().required(),
    contest: Joi.string()

}).options({abortEarly: false, allowUnknown: true});