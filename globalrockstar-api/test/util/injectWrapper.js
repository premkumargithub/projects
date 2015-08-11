'use strict';

module.exports = function injectWrapper(server) {
    return {
        inject: function (args, cb) {
            server.inject(args, function (res) {
                if (res.statusCode >= 400) {
                    cb(new Error('HTTP Error: ' + res.statusCode), res);
                } else {
                    cb(null, res);
                }
            });
        }
    };
};
