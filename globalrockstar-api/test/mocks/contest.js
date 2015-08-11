'use strict';

var utils = require('./_utils');

module.exports = {

    getMock: function () {
        return {
            "name": utils.createUniqueString("_CONTEST_TEST"),
            "updatedAt": new Date("2015-06-16T13:01:50.943Z"),
            "createdAt": new Date("2015-06-06T13:04:32.141Z"),
            "cfe": {
                "time": {
                    "start": new Date("2015-01-01T10:00:00.000Z"),
                    "end": new Date("2015-10-15T10:00:00.000Z")
                }
            },
            "np": {
                "time": {
                    "start": new Date("2015-10-01T10:00:00.000Z"),
                    "end": new Date("2015-11-01T10:00:00.000Z")
                }
            },
            "finals": {
                "time": {
                    "start": new Date("2015-11-01T10:00:00.000Z"),
                    "end": new Date("2015-12-01T10:00:00.000Z")
                }
            }
        };
    },

    // TODO: remove unused params
    //Define the expected object after create content
    getExpectedMock: function () {
        return [
        "_id",
        "updatedAt",
        "createdAt",
        "slug",
        "name",
        "charts",
        "globalfinalsBest16",
        "globalfinalsBest64",
        "globalfinalsQualification",
        "np",
        "cfe",
        "arenaLocked",
        "nextPhase",
        "previousPhase",
        "currentPhase",
        "attrAccessible",
        "id"
        ];
    }
};
