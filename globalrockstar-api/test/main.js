'use strict';

//Define the main config details here
module.exports = {
    "apiRoot": "http://localhost:3001",
    "expectedHeader" : "Content-Type",
    "successCode" : 200,
    //Common function to validate the xpected JSON from API
    validateTwoObjects: function (expected, response) {
        var len = expected.length;
        for (var i = 0; i < len; i++) {
            if (!response.hasOwnProperty(expected[i])) {
                return false;
            }
        }
        return true;
    }
};
