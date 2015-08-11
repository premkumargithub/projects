var utils = require('./_utils');

module.exports = {
    /**
     * Creates a mock object with minimal information needed for testing
     *
     * @param {string} artistId artist id
     * @returns {object}
     */
    getTiniestMock: function () {
        return {
            name: utils.createUniqueString("_ARTIST_TEST"),
            email: utils.createUniqueString(".artist.test@globalrockstar.com"),
            password: "123456789",
            password_confirmation: "123456789",
            country: "AT",
            toc: true
        };
    }
};
