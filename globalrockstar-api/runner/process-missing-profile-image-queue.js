'use strict';

/**
 * processes fans that logged in with facebook and do not have a profile image
 *
 *initialize uploads image and stores it in fan
 */

var Fan = require('../models/fan');
var config = require('../config'),
    nrp = require('node-redis-pubsub'),
    db = require('../lib/database'),
    request = require('request'),
    Q = require('q'),
    unagi = new nrp(config.redis);

function uploadImage(form) {
    var options = {},
        endpoint = '/upload/image',
        dfd, r, f;

    if (!endpoint) {
        throw new Error('endpoint is required!');
    }
    if (endpoint) {
        options.url = config.upload + endpoint;
    }

    dfd = Q.defer();
    r = request.post(options.url, function optionalCallback(err, httpResponse, body) {
        if (err) {
            console.error(err);
            dfd.reject(err);
        }

        dfd.resolve(body);
    });

    f = r.form();
    f.append('slug', form.slug);
    f.append('mimetype', form.file.headers['content-type']);

    console.log('https://graph.facebook.com/' + form.id + '/picture?width=9999&height=9999');
    f.append('file', request('https://graph.facebook.com/' + form.id + '/picture?width=9999&height=9999'));
    return dfd.promise;
}


unagi.process('fan:profile-image:get', function (job, done) {
        var fanId = job.data._id;
        console.log('fan:%s', fanId);
        Fan.findById(fanId, function (err, fan) {
                if (err) {
                    console.error(err);
                    return done(err);
                }
                if (fan.picture) return done();

                uploadImage({
                        id: fan.facebookId,
                        slug: fan.firstname + '-' + fan.lastname,
                        file: {
                            headers: {
                                'content-type': 'image/jpg'
                            }
                        }
                    }).then(function (_upload) {
                        var upload = JSON.parse(_upload);
                        fan.picture = upload.filename;
                        fan.save(done);
                    }).fail(function (err) {
                        console.log('fan:%s:error', fanId);
                        console.error(err);
                        done(err);
                    });
                });
        });
