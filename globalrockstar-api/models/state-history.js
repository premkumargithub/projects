'use strict';
var Schema = require('mongoose').Schema;

module.exports = new Schema({
    from: String,
    to: String,
    category: String,
    comment: String,
    createdAt: Date
});
