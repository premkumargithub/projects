'use strict';
var utils = require('./_utils');

module.exports = {
    //Define the keys for creating the comment
    getCommentMock: function () {
       return {
           userType: "artist",
           message: "Hello guys!!",
           country: "IN"
       };
   },
    //Define the keys for expecting the key values
    createAfterMock: function () {
        return [
            "_id",
            "artist",
            "user",
            "message",
            "country",
            "flagged",
            "likes",
            "replies"
        ];
    },
    //Define the keys for expecting the key values of reply
    createAfterReply: function () {
        return [
            "userType",
            "message",
            "_id",
            "flagged",
            "likes",
            "user"
        ];
    },
    //Define the keys for replying on comment
    getReplyMock: function () {
        return {
            message: "Hello guys reply!!"
        };
    }

};
