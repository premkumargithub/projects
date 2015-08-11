'use strict';
var utils = require('./_utils');

module.exports = {
    getProjectsMock: function () {
        return {
            title: utils.createUniqueString("My test project"),
            category: "Album",
            moneyToRaise: "600",
            teaserImage: "some/crazy/path",
            rewards: ["Free song", "Free Download", "CD", "CD plus T-Shirt", "New Car!"]
        };
    },
    //Define the keys for expecting the key values
    createAfterMock: function () {
        return [
            "_id",
            "updatedAt",
            "createdAt",
            "title",
            "category",
            "slug",
            "artist",
            "moneyToRaise",
            "teaserImage",
            "featured",
            "state",
            "rewards",
            "currency"
        ];
    }
};
