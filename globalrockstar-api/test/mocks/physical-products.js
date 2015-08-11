'use strict';
var utils = require('./_utils');

module.exports = {
    //Define the keys for expecting the key values
    predefinedMock: function () {
        return [
            "slug",
            "name",
            "price_range",
            "shipping_included"
        ];
    },
    //Define the keys for expecting the key values
    createAfterMock: function () {
        return [
            "_id",
            "updatedAt",
            "createdAt",
            "artist",
            "title",
            "description",
            "type",
            "price",
            "predefined",
            "shipping_included",
            "stock_handling",
            "stateHistory",
            "state"
        ];
    },
    //Define the keys to expect after reply
    createProduct: function () {
        return {
            title: utils.createUniqueString('PHYSICAL_PRODUCTSS'),
            description: "This is the physical product test infos",
            stock_handling: 15
        };          
    }
};
