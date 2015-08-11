'use strict';

var config = require('../config');
var mandrill = require('mandrill-api');

module.exports = function (artist, template, cta, done) {
    
    done = done || function () {
        console.log('done') ;
    } ; 
    
    if (!config.mandrill_api_key) return done();
    
    if (process.env.NODE_ENV != 'production' && process.env.NODE_ENV != 'amazon') {
        if (artist.email.split("@")[1] !== 'diamonddogs.cc' && artist.email.split("@")[1] !== 'globalrockstar.com') return done();
    }
    
    console.log(artist.email + " - " + artist.name);

    var mandrill_client = new mandrill.Mandrill(config.mandrill_api_key);

    var template_name = template ;

    var template_content = [];

    var to = [{
        'email': artist.email,
        'name': artist.name,
        'type': 'to'
    }] ;
    
    var message = {
        'global_merge_vars': [{
            'name': 'CTA_LINK',
            'content': cta
        }, {
            'name': 'CURRENT_YEAR',
            'content': 2014
        }],
        "to": to
    };

    mandrill_client.messages.sendTemplate({
        'template_name': template_name,
        'template_content': template_content,
        'async': true,
        'message': message,
        'ip_pool': 'Main Pool'
    }, function (result) {
        done();
        console.log(result);
    }, function (e) {
        done(e);
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });

};
