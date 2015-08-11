var shortid = require('shortid'),
    server = require('../../index');

module.exports = {

    /**
     * Create a unique string
     *
     * @param {string} trailingString
     * @returns {string}
     */
    createUniqueString: function (trailingString) {
        return +new Date() + shortid.generate() + trailingString;
    },

    /**
     * Remove a document from the database
     * @param {Mongoose Model} Model
     * @param {string} id the document id
     * @param {function} done callback
     */
    removeEntry: function (Model, id, done) {
        if (typeof id === "undefined") {
            console.error('Cannot remove element, id: ' + id + ". (" + Model.modelName + " model)");
            return;
        }
        Model.remove({_id: id}, function (err) {
            if (err) {
                console.error('Cannot remove element: ', err);
            }
            done();
        });
    },

    /**
     * Shorthand to get JSON content-type header
     *
     * @returns {string}
     */
    getAppJSONHeader: function () {
        return {
            'Content-Type': 'application/json'
        };
    },

    /**
     * Shorthand to create http request for tests
     *
     * @param {string} method HTTP verb
     * @param {string} url API url where to make the request
     * @param {object} [data] optional payload
     * @param {function} callback
     */
    inject: function (method, url, data, callback) {

        // Third param is optional
        if (typeof data === 'function') {
            callback = data;
        }

        server.inject({
            method: method,
            url: url,
            payload: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'}
        }, function (res) {
            var statusCode = res.statusCode,
                jsonPayload = res.payload ? JSON.parse(res.payload) : null;

            callback(statusCode, jsonPayload, res);
        });

    }
};
