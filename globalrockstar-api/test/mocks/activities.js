'use strict';

module.exports = {
    //Define the keys for expecting the key values
    createAfterMock: function () {
        return [
            "_id",
            "updatedAt",
            "createdAt",
            "country",
            "activity",
            "artist",
            "flagged",
            "replies"
        ];
    },
    //Define the keys to expect after reply
    createAfterReply: function () {
        return [
            "_id",
            "userType",
            "user",
            "message",
            "flagged",
            "createdAt"
        ];          
    }
};
