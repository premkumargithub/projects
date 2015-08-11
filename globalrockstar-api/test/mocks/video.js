var utils = require('./_utils'),
    genres = require('../../public/configs/genres.json');

module.exports = {

    /**
     * Creates a mock object with minimal information needed for testing videos upload directly on globalrockstar
     *
     * @param {string} artistId
     * @returns {object}
     */
    getTiniestUploadMock: function (artistId) {
        return {
            title: utils.createUniqueString("_VIDEO_TEST"),
            artist: artistId,
            originalSource: 'globalrockstar'
        };
    },

    /**
     * Creates a mock object with minimal information needed for testing videos upload from youtube to GR
     *
     * @param {string} artistId
     * @returns {object}
     */
    getTiniestYoutubeMock: function (artistId) {
        return {
            title: utils.createUniqueString("_VIDEO_TEST"),
            artist: artistId,
            youtubeURL: 'https://www.youtube.com/watch?v=8h2M4eQygBs',
            originalSource: 'youtube'
        };
    },

    /**
     * Creates a mock object for testing videos upload directly on globalrockstar
     *
     * @param {string} artistId
     * @returns {object}
     */
    getUploadMock: function (artistId) {
        return {
            title: utils.createUniqueString("_VIDEO_TEST"),
            artist: artistId,
            originalSource: 'globalrockstar',
            videoFile: utils.createUniqueString("_VIDEO_TEST"),
            genres: [genres[0]]
        };
    },

    /**
     * Creates a mock object for testing videos upload from youtube to GR
     *
     * @param {string} artistId
     * @returns {object}
     */
    getYoutubeMock: function (artistId) {
        return {
            title: utils.createUniqueString("_VIDEO_TEST"),
            artist: artistId,
            youtubeURL: 'https://www.youtube.com/watch?v=8h2M4eQygBs',
            originalSource: 'youtube',
            videoFile: utils.createUniqueString("_VIDEO_TEST"),
            genres: [genres[0], genres[1]]
        };
    }
};