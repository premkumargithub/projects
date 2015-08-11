/** 
*@module Helper:facebook-Info
*@description This module used to provide the facebook details 
*Required module define here for this helper module 
*@requires module:request
**/
//Used for http calls and It supports HTTPS and follows redirects by default
var request = require('request') ;

/**
* @description Provides the service to make FB request and check FB Id is valid
* @param {string} facebook - Facebook Id
* @param {Requester~requestCallback} cb - The callback that handles the error
* @callback Requester~requestCallback: cb
**/
module.exports = function (facebook, cb) {
    request('http://graph.facebook.com/' + facebook, function (err, res, body) {
        if (!err && res.statusCode === 200) {
            try {
                //Parse Facebook Id from request body
                var fbId = JSON.parse(body).id ;
                //Check If FacebookId there
                if (fbId) {
                    return cb(null, fbId) ;
                } else {
                    return cb(new Error('fb id not found')) ;
                }
            } catch (err) {
                return cb(err) ;
            }
        }
        return cb(err) ;
    }) ;
};
