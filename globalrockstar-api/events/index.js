/** 
*@module Event:Index
*@description this modulle is used for reading files in the Synchrouse way
*Required modules are defined here
*@requires module:node-redis-pubsub
*@requires module:../config
*@requires module:path
*@requires module:fs
**/

var nrp = require('node-redis-pubsub'),
    config = require('../config'),
    unagi = new nrp(config.redis),
    path = require('path'),
    fs = require('fs');

//Reads the file in the synchronouse way 
fs.readdirSync(__dirname).filter(function (file) {
    return path.join(__dirname, file) != __filename;
}).forEach(function (file) {
    console.log('Loading event handler: ' + file.replace('.js', ''));
    require('./' + path.basename(file))(unagi);
});

module.exports = [] ;
