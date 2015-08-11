'use strict';
var utils = require('./_utils');

module.exports = {
    //Define the kesy for artists that you expect for artists single object from "/artists" api
    getArtistMock: function () {
        return {
            name: utils.createUniqueString("Artist name"),
            email: utils.createUniqueString("artisrtest@host.com"),
            country: "IN",
            password: "hrhk@1234",
            password_confirmation: "hrhk@1234",
            toc: "on"
        };
    },
    getfacebookUserMock: function () {
        return {
            name: utils.createUniqueString("Artist name"),
            email: utils.createUniqueString("artisrtest@host.com"),
            country: "IN",
            picture: "test.png",
            facebookId: "100007142718727",
            toc: "on",
            newsletter: true,
            invitationToken: utils.createUniqueString("artisrtest34text")
        };
    },
    //Define the kesy for artists that you expect for artists single object from "/artists" api
    getChangedPassword: function () {
        var uniqueString = utils.createUniqueString("artist@1234");
        return {
            password: uniqueString,
            password_confirmation: uniqueString
        };
    },
    updateArtist: function () {
        return {
            city: utils.createUniqueString("Artist city"),
            genres_music: ["Rock"],
            genres_own: ["Rock"],
            birthdate: "1989-10-05",
            name: utils.createUniqueString("Prem"),
            email: utils.createUniqueString("prem.baboo@daffodilsw.com"),
            country: "IN",
            contact: {
                first_name: utils.createUniqueString("Prem"),
                last_name: utils.createUniqueString("Baboo"),
                gender: "male",
                address: "Gurgaon",
                postal_code: "122001",
                country: "IN",
                telephone: "9015613691",
                city: "Gurgaon",
                birthdate: "1989-10-05",
                email: utils.createUniqueString("prem.baboo@daffodilsw.com")
            },
            state: "active",
            isComplete: true,
            verified: "2015-06-06"
        };
    },
    //Define the expected kye in the response after create
    createAfterMock: function () {
        return [
            "name",
            "slug",
            "newsletter",
            "verificationToken",
            "id",
            "totalPlays",
            "email",
            "isComplete",
            "state",
            "genres"
        ];
    },
    //Define the expected object after create content
    getExpectedMock: function () {
        return [
            "_id",
            "fanCount",
            "updatedAt",
            "createdAt",
            "slug",
            "state",
            "name",
            "email",
            "country",
            "fan_of_artist",
            "facebookPages",
            "expenses",
            "earnings",
            "totalPlays",
            "stateHistory",
            "fans_a",
            "fans",
            "projects",
            "isComplete",
            "verificationToken",
            "paypal_verified",
            "currency",
            "contact",
            "genres_own",
            "genres_music",
            "arena",
            "activitystream",
            "notifications",
            "newsletter",
            "terms14073",
            "terms"
        ];
    },
    /**
    *   @function
    *   @name getArtistDetail
    *   @desc Contain the keys for artist detail response
    **/
    getArtistDetial : function () {
        return [
            '_id',
            'fanCount',
            'updatedAt',
            'createdAt',
            'slug',
            'state',
            'name',
            'email',
            'country',
            '__v',
            'fan_of_artist',
            'facebookPages',
            'expenses',
            'earnings',
            'totalPlays',
            'projects',
            'isComplete',
            'paypal_verified',
            'currency',
            'contact',
            'genres_own',
            'genres_music',
            'arena',
            'activitystream',
            'notifications',
            'newsletter',
            'terms14073',
            'terms',
            'songs',
            'selectedSong',
            'fans',
            'randomFans'
        ];
    },
    /**
    *   @function
    *   @name getArtistStatistics
    *   @desc Contain the keys for  getArtistStatistics response
    **/
    getArtistStatistics : function () {
        return [
            "artiststat",
            "projects",
            "purchases",
            "supervote"
        ];
    }
};
