var utils = require('./_utils');

module.exports = {
    /**
     * Creates a mock object with minimal information needed for testing
     *
     * @param {string} artistId artist id
     * @returns {object}
     */
    getTiniestMock: function (artistId) {
        return {
            title: utils.createUniqueString('_ALBUM_TEST'),
            artist: artistId,
            genres: ['Rock', 'Punk', 'Pop'],
            price: 10,
            order: 1
        };
    },

    /**
     * Creates a mock object with all the information needed for testing
     *
     * @param {string} artistId artist id
     * @returns {object}
     */
    getMock: function (artistId) {
        var uniqueString = utils.createUniqueString('_ALBUM_TEST');

        return {
            title: uniqueString,
            artist: artistId,
            genres: ['Rock', 'Punk', 'Pop'],
            order: 1,
            label: uniqueString,
            upcCode: uniqueString,
            publisher: uniqueString,
            price: 10,
            flagged_date: '2015/05/24',
            flagged: true,
            flagged_reason: uniqueString,
            stars: 5,
            state: 'active'
        };
    }
};