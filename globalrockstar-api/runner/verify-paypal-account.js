'use strict';

var config = require("../config"),
    models = require('../models'),
    db = require('../lib/database'),
    mongoose = require('mongoose'),
    Q = require('q'),
    _ = require('lodash'),
    Hapi = require('hapi');

console.log(config);

var Artist = mongoose.model('Artist');
var ppController = require('../controllers/paypal');

var updated = 0;

var artists = [];

function sequentialCheck() {
    var a = artists.pop();
    if (!a) {
        console.log("Checked " + updated + " accounts.");
        console.log("Finished!");
        process.exit(0);
    }
    verifyArtist(a);
}

function verifyArtist(artist) {
    var dfd = Q.defer();

    var logMessage = 'ARTIST name: ' + artist.name + ' email: ' + artist.paypal_email + ' firstname: ' + artist.paypal_firstname + ' lastname: ' + artist.paypal_lastname + '\n';
    ppController.checkAccountExists(artist.paypal_email, artist.paypal_firstname, artist.paypal_lastname)
        .then(function (msg) {
            logMessage += msg + '\n';

            return ppController.checkAcceptsCurrency(artist.paypal_email, 'EUR');
        })
        .then(function (msg) {
            logMessage += msg + '\n';
            return ppController.checkAcceptsCurrency(artist.paypal_email, 'USD');
        })
        .then(function (msg) {
            logMessage += msg + '\n';

            console.log(logMessage);

            updated++;
            sequentialCheck();
            dfd.resolve();
        })
        .fail(function (msg) {
            logMessage += msg + '\n';

            console.log(logMessage);
            updated++;
            sequentialCheck();
            dfd.resolve();
        });

    return dfd.promise;
}

artists = [
{
    name: "Erin",
    paypal_email: "erin.crowley@hotmail.com",
    paypal_firstname: "Erin",
    paypal_lastname: "Crowley",
},
{
    name: "Liza Eve",
    paypal_email: "lizaevemusic@gmail.com",
    paypal_firstname: "liza",
    paypal_lastname: "pereira",
},
{
    name: "Ellie Hopkins",
    paypal_email: "jake.t.abbott@gmail.com",
    paypal_firstname: "Jake",
    paypal_lastname: "Abbott",
},
{
    name: "Lynda Law",
    paypal_email: "lindagaga65pool@gmail.com",
    paypal_firstname: "Lynne",
    paypal_lastname: "Briggs",
},
{
    name: "Moscato",
    paypal_email: "moscatorocks@yahoo.com.au",
    paypal_firstname: "john",
    paypal_lastname: "mcmenamin",
},
{
    name: "RayMorgana",
    paypal_email: "ray@raymondjaquez.com",
    paypal_firstname: "Raymond",
    paypal_lastname: "Jaquez",
},
{
    name: "John Herote",
    paypal_email: "katja@yellowoctaves.com",
    paypal_firstname: "Fredrik",
    paypal_lastname: "Zeller",
},
{
    name: "Bxperience",
    paypal_email: "amabeex@gmail.com",
    paypal_firstname: "Anna M.A.",
    paypal_lastname: "Beex",
},
{
    name: "The Static Dial",
    paypal_email: "vasilig@sbcglobal.net",
    paypal_firstname: "Basil",
    paypal_lastname: "Gerazounis",
},
{
    name: "Ewian",
    paypal_email: "me@ewian.de",
    paypal_firstname: "Ewian",
    paypal_lastname: "Christensen",
},
{
    name: "Quantor",
    paypal_email: "maicel.kiel@gmx.de",
    paypal_firstname: "Maicel",
    paypal_lastname: "Kiel",
},
{
    name: "Joe LaBianca",
    paypal_email: "joelabianca@pa.net",
    paypal_firstname: "Joe",
    paypal_lastname: "LaBianca",
},
{
    name: "Little Coyote",
    paypal_email: "achieve_booyah@hotmail.com",
    paypal_firstname: "Joel",
    paypal_lastname: "English",
},
{
    name: "Kristin Moura",
    paypal_email: "kristinmouraofficial@gmail.com",
    paypal_firstname: "kristin",
    paypal_lastname: "moura",
},
{
    name: "Roberto Nochez",
    paypal_email: "rcnochez@hotmail.com",
    paypal_firstname: "Roberto",
    paypal_lastname: "Nochez",
},
{
    name: "MR. JONES",
    paypal_email: "horvi.c@gmx.at",
    paypal_firstname: "Christian",
    paypal_lastname: "Horvatits",
},
{
    name: "Andrew McCrink",
    paypal_email: "amccrink@talktalk.net",
    paypal_firstname: "Andrew",
    paypal_lastname: "McCrink",
},
{
    name: "Richie Sensei",
    paypal_email: "kyakarot@yahoo.com",
    paypal_firstname: "Richardo",
    paypal_lastname: "Edwards",
},
{
    name: "James Ethan Clark",
    paypal_email: "manager@jamesethanclark.com",
    paypal_firstname: "JAMES",
    paypal_lastname: "CLARK",
},
{
    name: "Lijie",
    paypal_email: "lijie@iamlijie.com",
    paypal_firstname: "Lijie",
    paypal_lastname: "Yang",
},
{
    name: "James Lilly",
    paypal_email: "givenchy2k5@hotmail.co.uk",
    paypal_firstname: "James",
    paypal_lastname: "Lilly",
},
{
    name: "A Million Souls",
    paypal_email: "Therockslave@gmail.com",
    paypal_firstname: "Giovanni",
    paypal_lastname: "Martínez",
},
{
    name: "Some Velvet Morning",
    paypal_email: "mail@somevelvetmorning.co.uk",
    paypal_firstname: "Rob",
    paypal_lastname: "Flanagan",
},
{
    name: "WEDGE",
    paypal_email: "shop@maghood.com",
    paypal_firstname: "Kiryk",
    paypal_lastname: "Drewinski",
},
{
    name: "markboutilier",
    paypal_email: "markbouts@hotmail.com",
    paypal_firstname: "Mark",
    paypal_lastname: "Boutilier",
},
{
    name: "KNiKi + Mike Beale",
    paypal_email: "dimsal@optusnet.com.au",
    paypal_firstname: "KNiKi",
    paypal_lastname: "Saleeba",
},
{
    name: "Rhett May",
    paypal_email: "rhett@rhettmay.com.au",
    paypal_firstname: "Rhett",
    paypal_lastname: "May",
},
{
    name: "Roy Dahan",
    paypal_email: "roydahann@gmail.com",
    paypal_firstname: "roy",
    paypal_lastname: "dahan",
},
{
    name: "Santiago Ferreira",
    paypal_email: "santiagoferreira@email.cz",
    paypal_firstname: "Santiago",
    paypal_lastname: "Ferreira",
},
{
    name: "Shane Board",
    paypal_email: "contact@pop4diabetes.co.uk",
    paypal_firstname: "Shane",
    paypal_lastname: "Board",
},
{
    name: "Tom Joyce",
    paypal_email: "tjoyce1980@yahoo.co.uk",
    paypal_firstname: "Tom",
    paypal_lastname: "Joyce",
},
{
    name: "Crystal Porter",
    paypal_email: "crystalportermusic@gmail.com",
    paypal_firstname: "Crystal",
    paypal_lastname: "Porter",
},
{
    name: "Chaittali Shrivasttava",
    paypal_email: "chaittalishrivasttava@gmail.com",
    paypal_firstname: "Chaittali",
    paypal_lastname: "Shrivasttava",
},
{
    name: "Bill Madison",
    paypal_email: "Madisonatwarren@aol.com",
    paypal_firstname: "Bill",
    paypal_lastname: "Madison",
},
{
    name: "TORKE",
    paypal_email: "denisets79@hotmail.com",
    paypal_firstname: "TORKE",
    paypal_lastname: "PERU",
}
];

sequentialCheck();

