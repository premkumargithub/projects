'use strict';

var utils = require('./_utils');

module.exports = {
    //Defien the slider data to create the Slider
    getCreateSliderMock: function () {
        return {
            name: utils.createUniqueString("My test slider"),
            image: utils.createUniqueString("bla.jpg"),
            text: utils.createUniqueString("Awesome slider html for testing")
        };
    },
    //Define the expected object after create content
    getExpectedMock: function () {
        return [
			"_id",
			"updatedAt",
			"createdAt",
			"slug",
			"name",
			"image",
			"text",
			"public",
			"priority",
			"position"
		];
    }
};
