var Joi = require('joi'),
    genres = require('../public/configs/genres.json'),
    states = require('../public/configs/states.json');

// TODO: verify and specify from where this command is used (backend, frontend, both)
// Validation against the create command
module.exports.createSchema = Joi.object().keys({

    title: Joi.string().required(),
    genres: Joi.array().includes(Joi.string().valid(genres)).required(),
    order: Joi.number().required(),

    // Used only for internal reference
    gr_doc_ver: Joi.number().default(2),

    artist: Joi.string(),

    copyright_lyrics: Joi.string().default('none'),
    copyright_music: Joi.string().default('none'),
    copyright_publisher: Joi.string().default('none'),

    price: Joi.number(),
    audiofile: Joi.string(),
    image: Joi.string(),
    album: Joi.string(),
    label: Joi.string(),
    upcCode: Joi.string(),
    ISRC: Joi.string(),
    publisher: Joi.string(),

    /**
     * Artist can eventually link a related video on this song
     */
    video: Joi.string(),

    /**
     * A song can participate in the contest
     */
    contest: Joi.string(),

    description: Joi.string(),
    lyrics: Joi.string(),

    stars: Joi.number().integer().min(0).max(5).default(0),
    state: Joi.string().valid(states).default(states[0])

}).options({abortEarly: false, allowUnknown: true});


// TODO: verify and specify from where this command is used (backend, frontend, both)
// Validation against the update command
module.exports.updateSchema = Joi.object({

    title: Joi.string().required(),
    genres: Joi.array().required(),
    order: Joi.number().required(),

    copyright_lyrics: Joi.string().default('none'),
    copyright_music: Joi.string().default('none'),
    copyright_publisher: Joi.string().default('none'),

    audiofile: Joi.string(),

    description: Joi.string(),
    lyrics: Joi.string(),

    stars: Joi.number().integer().min(0).max(5)

}).options({abortEarly: false, allowUnknown: true});


// TODO: verify and specify from where this command is used (backend, frontend, both)
// Validation against the participate command
module.exports.participateSchema = Joi.object().keys({
    title: Joi.string().required(),
    artist: Joi.string().required(),
    genres: Joi.array().required(),
    order: Joi.number().required(),

    copyright_lyrics: Joi.string().default('none'),
    copyright_music: Joi.string().default('none'),
    copyright_publisher: Joi.string().default('none'),

    audiofile: Joi.string(),

    sponsoring: Joi.boolean(),
    reward: Joi.boolean()
}).options({abortEarly: false, allowUnknown: true});

// TODO: verify and specify from where this command is used (backend, frontend, both)
// Validation against the "update and participate" command
module.exports.updateParticipateSchema = Joi.object({

    title: Joi.string().required(),
    artist: Joi.string().required(),
    genres: Joi.array().required(),
    order: Joi.number().required(),

    audiofile: Joi.string(),

    copyright_lyrics: Joi.string().default('none'),
    copyright_music: Joi.string().default('none'),
    copyright_publisher: Joi.string().default('none'),

    description: Joi.string(),
    lyrics: Joi.string(),

    spotifyUrl: Joi.string(),
    itunesUrl: Joi.string(),

    stars: Joi.number().integer().min(0).max(5),

    sponsoring: Joi.boolean(),
    reward: Joi.boolean()
}).options({abortEarly: false, allowUnknown: true});

// TODO: verify and specify from where this command is used (backend, frontend, both)
// Validation against the "delete" command
module.exports.deleteSchema = Joi.object({
    state: Joi.string().default('deleted')
}).options({abortEarly: false});

// TODO: verify and specify from where this command is used (backend, frontend, both)
// Validation against the flag command
module.exports.flagSchema = Joi.object({
    flagged_date: Joi.date(),
    flagged: Joi.boolean(),
    flagged_reason: Joi.string()
}).options({abortEarly: false});