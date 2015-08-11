/* globals before, after */

'use strict';

var dbUtil = require('./util/db');

before(function (done) {
    dbUtil.resetDB().then(function () {
        console.log('Reseted DB - start tests');
        done();
    });
});

after(function (done) {
    dbUtil.resetDB().then(function () {
        console.log('Reseted DB - finished tests');
        done();
    });
});
