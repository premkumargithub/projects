var Joi = require('joi') ;


module.exports.createSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8),
    password_confirmation: Joi.ref('password'),
    country: Joi.string().required(),
    file: Joi.object().optional(),
    picture: Joi.alternatives().when('file', {
        is: true,
        then: Joi.string(),
        otherwise: Joi.any()
    }),
    facebookId: Joi.string(),
    toc: Joi.boolean().required(),
    newsletter: Joi.boolean(),
    invitationToken: Joi.any(),
    contestMedia: Joi.string()
}).options({abortEarly:false}).xor('facebookId', 'password') ;

module.exports.loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
}).options({abortEarly:false}) ;

module.exports.changePasswordSchema = Joi.object({
    password: Joi.string().required(),
    password_confirmation: Joi.string().required()
}).options({abortEarly:false}) ;

module.exports.facebookLoginSchema = Joi.object({
    facebookId: Joi.string().required(),
    email: Joi.string().email().required(),
    name: Joi.string().required()
}).options({abortEarly:false}) ;

// create the schema for the fan using the joi
// which validate the id and the type of the fan
module.exports.fanSchema = Joi.object({
    _id: Joi.string().required(),
    type: Joi.string().required()
}).options({abortEarly:false}) ;

module.exports.updateSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    //youtube: Joi.string(),
    //twitter: Joi.string(),
    //youtube: Joi.string(),
    //website: Joi.string(),
    //biography: Joi.string(),
    newsletter: Joi.boolean(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    genres_music: Joi.array().required(),
    genres_own: Joi.array().required(),
    file: Joi.object().optional(),
    picture: Joi.alternatives().when('file', {
        is: true,
        then: Joi.string(),
        otherwise: Joi.any()
    }),
    message: Joi.any(),
    birthdate: Joi.string().required(),
    contact: {
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        gender: Joi.string().required(),
        address: Joi.string().required(),
        postal_code: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        telephone: Joi.any(),
        birthdate: Joi.string().required(),
        email: Joi.string().required()
    },
    paypal_email: Joi.any(),
    terms14073: Joi.boolean(),
    skip_paypal: Joi.boolean().optional(),
    contestMedia: Joi.string()
}).options({abortEarly:false, allowUnknown: true}) ;

module.exports.updateAdminSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    //youtube: Joi.string(),
    //twitter: Joi.string(),
    //youtube: Joi.string(),
    //website: Joi.string(),
    //biography: Joi.string(),
    newsletter: Joi.boolean(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    genres_music: Joi.array().required(),
    genres_own: Joi.array().required(),
    file: Joi.object().optional(),
    /*    picture: Joi.alternatives().when('file', {
            is: true,
            then: Joi.string(),
            otherwise: Joi.any()
        }),
*/    message: Joi.any(),
    birthdate: Joi.string().required(),
    contact: {
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        gender: Joi.string().required(),
        address: Joi.string().required(),
        postal_code: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        telephone: Joi.any(),
        birthdate: Joi.string().required()
    },
    paypal_email: Joi.any(),
    terms14073: Joi.boolean(),
    skip_paypal: Joi.boolean().optional()
}).options({abortEarly:false, allowUnknown: true}) ;



module.exports.updateSettingsSchema = Joi.object({
    arena: Joi.string().required(),
    currency: Joi.string(),
    newsletter: Joi.boolean(),
    notifications: Joi.boolean(),
    preferredCountry: Joi.string(),
    activitystream: Joi.boolean()
}).options({abortEarly:false});

module.exports.verifySchema = Joi.object({
    verified: Joi.date().required()
}).options({allowUnknown: true});


module.exports.setContestMedia = Joi.object({
    contestMedia: Joi.string().required(),
    contestMediaType: Joi.string().valid(['song', 'video']).required()
});

module.exports.setPreferredMedia = Joi.object({
    preferredMedia: Joi.string().required(),
    preferredMediaType: Joi.string().valid(['song', 'video']).required()
});