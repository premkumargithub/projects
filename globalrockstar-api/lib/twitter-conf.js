'use strict';
/**
 * @module Lib:Twitter-conf
 * @description Provides twitter config information 
 * @requires module:mongoose
 */
var config = require('../config');
var OAuth = require('oauth');
var OAuth2 = OAuth.OAuth2;
var twitterConsumerKey = config.twitter.key;
var twitterConsumerSecret = config.twitter.secret;

//Instantiate the Twitter auth object
var oauth2 = new OAuth2(
    twitterConsumerKey,
    twitterConsumerSecret,
    'https://api.twitter.com/',
    null,
    'oauth2/token',
    null
);

oauth2.useAuthorizationHeaderforGET(true);

//provide a default if twitter api is not reachable;
var twitterConfig = { characters_reserved_per_media: 23,
  max_media_per_upload: 1,
  non_username_paths:
   ['about',
     'account',
     'accounts',
     'activity',
     'all',
     'announcements',
     'anywhere',
     'api_rules',
     'api_terms',
     'apirules',
     'apps',
     'auth',
     'badges',
     'blog',
     'business',
     'buttons',
     'contacts',
     'devices',
     'direct_messages',
     'download',
     'downloads',
     'edit_announcements',
     'faq',
     'favorites',
     'find_sources',
     'find_users',
     'followers',
     'following',
     'friend_request',
     'friendrequest',
     'friends',
     'goodies',
     'help',
     'home',
     'i',
     'im_account',
     'inbox',
     'invitations',
     'invite',
     'jobs',
     'list',
     'login',
     'logo',
     'logout',
     'me',
     'mentions',
     'messages',
     'mockview',
     'newtwitter',
     'notifications',
     'nudge',
     'oauth',
     'phoenix_search',
     'positions',
     'privacy',
     'public_timeline',
     'related_tweets',
     'replies',
     'retweeted_of_mine',
     'retweets',
     'retweets_by_others',
     'rules',
     'saved_searches',
     'search',
     'sent',
     'sessions',
     'settings',
     'share',
     'signup',
     'signin',
     'similar_to',
     'statistics',
     'terms',
     'tos',
     'translate',
     'trends',
     'tweetbutton',
     'twttr',
     'update_discoverability',
     'users',
     'welcome',
     'who_to_follow',
     'widgets',
     'zendesk_auth',
     'media_signup'],
  photo_size_limit: 3145728,
  photo_sizes:
   { thumb: { h: 150, resize: 'crop', w: 150 },
     small: { h: 480, resize: 'fit', w: 340 },
     medium: { h: 1200, resize: 'fit', w: 600 },
     large: { h: 2048, resize: 'fit', w: 1024 } },
  short_url_length: 24,
  short_url_length_https: 25 };

/**
 * @name Lib:Twitter-conf.updateConfig
 * @function 
 * @desc: Used to update the twitter config details
 */
function updateConfig() {
    oauth2.getOAuthAccessToken('', {
        'grant_type': 'client_credentials'
    }, function (e, access_token, refresh_token, results) {
        oauth2.get('https://api.twitter.com/1.1/help/configuration.json', access_token, function (err, res) {
            try {
                var data = JSON.parse(res);
                data.short_url_length += 1;
                data.short_url_length_https += 1;
                twitterConfig = data;
                console.log('twitter:config:updated');
            } catch (e) {
                console.error('twitter:get:config:' + e);
            }
        });
    });
}

//Checks the node environment is test or not
if (process.env.NODE_ENV == 'test') {
    setInterval(updateConfig, 1000 * 60 * 60 * 5);
    updateConfig();
}

module.exports = twitterConfig;
