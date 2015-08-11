/** 
*@module Helper:Youtube-Info
*@description This module used to provide the youtube info 
*Required module define here for this helper module 
*@requires module:ytdl
*@requires module:q
*@requires module:request
*@requires module:lodash
**/
var q = require('q') ;
var request = require('request') ;
var _ = require('lodash') ;

/**
 * Provides youtube URL 
 * @name Helper:Youtube-Info.youtubeUrl
 * @function 
 * @param {objectId} videoId 
 * @return {string} URL URL string 
 */
var youtubeUrl = function (videoId) {
    // depreciated 
    // commented by abhinav nehra
    return 'http://gdata.youtube.com/feeds/api/videos/' + videoId + '?v=2&alt=jsonc';

    // please uncomment this url as now youtube support this api
    //return 'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id='+ videoId + '&key=AIzaSyC-nrSBuqYIZdlRmkQgOchKbpR6mL0Xr20';
};

/**
 * Get youtubeId from the youtube URL 
 * @name Helper:Youtube-Info.youtubeId
 * @function 
 * @param {string} youtube URL 
 * @return {string} youtubeId 
 */
function youtubeId(text) {
    var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
    return text.replace(re, '$1') ;
}

module.exports = function (song, yUrl, cb) {

    var video_id = youtubeId(yUrl) ;
    console.log('youttube:load:%s', video_id);
    //Invokes youtube song upload
    q.ninvoke(request, 'get', youtubeUrl(video_id))
    .then(function (res) {
        console.log('youttube:complete:%s', video_id);

        if (yUrl === video_id)
            return cb(null, song) ;

        var data = JSON.parse(res[1]) ;

        song.youtube.id = video_id ;
        song.youtube.uploader     = data.data.uploader ;
        song.youtube.description  = data.data.description ;
        song.youtube.category     = data.data.category ;
        song.youtube.duration     = data.data.duration ;
        song.youtube.thumbnails   = _.values(data.data.thumbnail) ;
        song.youtube.description  = data.data.description ;

        return cb(null, song) ;
    })
    .fail(function (err) {
        console.log('youttube:fail:%s', video_id);
        console.log(err) ;
        return cb(null, song) ;
    }) ;
};
