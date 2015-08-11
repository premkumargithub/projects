'use strict';

var utils = require('./_utils');

module.exports = {
    //Defien the slider data to create the Slider
    getCreateContentMock: function () {
        return {
            firstname: utils.createUniqueString("SupportTicket title"),//Optional
            lastname: utils.createUniqueString("SupportTicket lastname"),//Optional
            email: utils.createUniqueString(".test@host.com"),//Optional
            category: utils.createUniqueString("job"),//Optional
            message: utils.createUniqueString("Test message")//Optional
        };
    },
    //Define the expected object after create content
    getExpectedMock: function () {
        return [
		"_id",
		"updatedAt",
		"createdAt",
		"firstname",
		"lastname",
		"message",
		"category",
		"email",
		"stateHistory",
		"state"
		];
    }
};
