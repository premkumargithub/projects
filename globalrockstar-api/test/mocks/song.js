var utils = require('./_utils');

module.exports = {
    /**
     * Creates a mock object with minimal information needed for testing
     *
     * @returns {object}
     */
    getTiniestMock: function () {
        return {
            // artist is not mandatory here as we add a new song using the /artists API
            title: utils.createUniqueString("_SONG_TEST"),
            genres: ['Rock', 'Punk', 'Pop'],
            order: 1
        };
    },

    /**
     * Creates a mock object for testing
     *
     * @returns {object}
     */
    getMock: function () {
        return {
            title: utils.createUniqueString("_SONG_TEST"),
            audiofile: 'FILE_NAME',
            price: 10,
            genres: ['Rock', 'Punk', 'Pop'],
            copyright_lyrics: 'LYRICS',
            copyright_music: 'COPYRIGHTS',
            copyright_publisher: 'PUBLISHER',
            sponsoring: false,
            reward: false,
            order: 1
        };
    }
};