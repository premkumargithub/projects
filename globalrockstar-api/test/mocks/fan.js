var utils = require('./_utils');

module.exports = {
    /**
     * Creates a mock object with minimal information needed for testing
     *
     * @returns {object}
     */
    getTiniestMock: function () {
        return {
            "firstname": utils.createUniqueString("_FAN_TEST"),
            "lastname": utils.createUniqueString("GR_FAN_TEST"),
            "email": utils.createUniqueString(".fan.test@globalrockstar.com"),
            "country": "Austria",
            "genres": ["Rock"],
            "password": "123456789",
            "password_confirmation": "123456789",
            "toc": true
        };
    }
};