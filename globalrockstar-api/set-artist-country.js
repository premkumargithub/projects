process.env.NODE_ENV = 'legacy' ;

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Hapi = require('hapi');

var Artist = mongoose.model('Artist') ;
var ChartEntry = mongoose.model('ChartEntry') ;
var Song = mongoose.model('Song') ;
var Contest = mongoose.model('Contest') ;



var countries = [
  {
    "name":"",
    "code":"",
    "code-2":""
  },
  {
    "name":"Afghanistan",
    "code":"AF",
    "code-2":"AFG"
  },
  {
    "name":"Albania",
    "code":"AL",
    "code-2":"ALB"
  },
  {
    "name":"Algeria",
    "code":"DZ",
    "code-2":"DZA"
  },
  {
    "name":"Andorra",
    "code":"AD",
    "code-2":"AND "
  },
  {
    "name":"Antigua and Barbuda",
    "code":"AG",
    "code-2":"ATG"
  },
  {
    "name":"Argentina",
    "code":"AR",
    "code-2":"ARG"
  },
  {
    "name":"Armenien",
    "code":"AM",
    "code-2":"ARM"
  },
  {
    "name":"Austria",
    "code":"AT",
    "code-2":"AUT"
  },
  {
    "name":"Australia",
    "code":"AU",
    "code-2":"AUS"
  },
  {
    "name":"Azerbaijan",
    "code":"AZ",
    "code-2":"AZE"
  },
  {
    "name":"Bahamas",
    "code":"BS",
    "code-2":"BHS"
  },
  {
    "name":"Bahrain",
    "code":"BH",
    "code-2":"BHR"
  },
  {
    "name":"Bangladesh",
    "code":"BD",
    "code-2":"BGD"
  },
  {
    "name":"Barbados",
    "code":"BB",
    "code-2":"BRB"
  },
  {
    "name":"Belarus",
    "code":"BY",
    "code-2":"BLR"
  },
  {
    "name":"Belgium",
    "code":"BE",
    "code-2":"BEL"
  },
  {
    "name":"Belize",
    "code":"BZ",
    "code-2":"BLZ"
  },
  {
    "name":"Benin",
    "code":"BJ",
    "code-2":"BEN"
  },
  {
    "name":"Bhutan",
    "code":"BT",
    "code-2":"BTN"
  },
  {
    "name":"Bolivia",
    "code":"BO",
    "code-2":"BOL"
  },
  {
    "name":"Bosnia and Herzegovina",
    "code":"BA",
    "code-2":"BIH"
  },
  {
    "name":"Botswana ",
    "code":"BW",
    "code-2":"BWA"
  },
  {
    "name":"Brazil",
    "code":"BR",
    "code-2":"BRA"
  },
  {
    "name":"Brunei",
    "code":"BN",
    "code-2":"BRN"
  },
  {
    "name":"Bulgaria",
    "code":"BG",
    "code-2":"BGR"
  },
  {
    "name":"Burkina Faso",
    "code":"BF",
    "code-2":"BFA"
  },
  {
    "name":"Burundi",
    "code":"BI",
    "code-2":"BDI"
  },
  {
    "name":"Cambodia",
    "code":"KH",
    "code-2":"KHM"
  },
  {
    "name":"Cameroon",
    "code":"CM",
    "code-2":"CMR"
  },
  {
    "name":"Canada",
    "code":"CA",
    "code-2":"CAN"
  },
  {
    "name":"Cape Verde",
    "code":"CV",
    "code-2":"CPV"
  },
  {
    "name":"Central African Republic",
    "code":"CF",
    "code-2":"CAF"
  },
  {
    "name":"Chad",
    "code":"TD",
    "code-2":"TCD"
  },
  {
    "name":"Chile",
    "code":"CL",
    "code-2":"CHL"
  },
  {
    "name":"China ",
    "code":"CN",
    "code-2":"CHN"
  },
  {
    "name":"Colombia",
    "code":"CO",
    "code-2":"COL"
  },
  {
    "name":"Comoros",
    "code":"KM",
    "code-2":"COM"
  },
  {
    "name":"Congo (Democratic)",
    "code":"CD",
    "code-2":"COD"
  },
  {
    "name":"Congo (Republic)",
    "code":"CG",
    "code-2":"COG"
  },
  {
    "name":"Costa Rica",
    "code":"CR",
    "code-2":"CRI"
  },
  {
    "name":"Cote d'Ivoire",
    "code":"CI",
    "code-2":"CIV"
  },
  {
    "name":"Croatia",
    "code":"HR",
    "code-2":"HRV"
  },
  {
    "name":"Cuba",
    "code":"CU",
    "code-2":"CUB"
  },
  {
    "name":"Republic of Cyprus",
    "code":"CY",
    "code-2":"CYP"
  },
  {
    "name":"Czech Republic",
    "code":"CZ",
    "code-2":"CZE"
  },
  {
    "name":"Denmark",
    "code":"DK",
    "code-2":"DNK"
  },
  {
    "name":"Djibouti",
    "code":"DJ",
    "code-2":"DJI"
  },
  {
    "name":"Dominica",
    "code":"DM",
    "code-2":"DMA"
  },
  {
    "name":"Dominican Republic",
    "code":"DO",
    "code-2":"DOM"
  },
  {
    "name":"East Timor",
    "code":"TL",
    "code-2":"TLS"
  },
  {
    "name":"Ecuador",
    "code":"EC",
    "code-2":"ECU"
  },
  {
    "name":"Egypt",
    "code":"EG",
    "code-2":"EGY"
  },
  {
    "name":"El Salvador",
    "code":"SV",
    "code-2":"SLV"
  },
  {
    "name":"Equatorial Guinea",
    "code":"GQ",
    "code-2":"GNQ"
  },
  {
    "name":"Eritrea",
    "code":"ER",
    "code-2":"ERI"
  },
  {
    "name":"Estonia",
    "code":"EE",
    "code-2":"EST"
  },
  {
    "name":"Ethiopia",
    "code":"ET",
    "code-2":"ETH"
  },
  {
    "name":"Fiji",
    "code":"FJ",
    "code-2":"FJI"
  },
  {
    "name":"Finland",
    "code":"FI",
    "code-2":"FIN"
  },
  {
    "name":"France",
    "code":"FR",
    "code-2":"Frau"
  },
  {
    "name":"Gabon",
    "code":"GA",
    "code-2":"GAB"
  },
  {
    "name":"Gambia",
    "code":"GM",
    "code-2":"GMB"
  },
  {
    "name":"Georgia",
    "code":"GE",
    "code-2":"GEO"
  },
  {
    "name":"Germany",
    "code":"DE",
    "code-2":"DEU"
  },
  {
    "name":"Ghana",
    "code":"GH",
    "code-2":"GHA"
  },
  {
    "name":"Greece",
    "code":"GR",
    "code-2":"GRC"
  },
  {
    "name":"Grenada",
    "code":"GD",
    "code-2":"GRD"
  },
  {
    "name":"Guatemala",
    "code":"GT",
    "code-2":"GTM"
  },
  {
    "name":"Guinea Bissau",
    "code":"GW",
    "code-2":"GNB"
  },
  {
    "name":"Guinea",
    "code":"GN",
    "code-2":"GIN"
  },
  {
    "name":"Guyana",
    "code":"GY",
    "code-2":"GUY"
  },
  {
    "name":"Haiti",
    "code":"HT",
    "code-2":"HTI"
  },
  {
    "name":"Honduras",
    "code":"HN",
    "code-2":"HND"
  },
  {
    "name":"Hungary",
    "code":"HU",
    "code-2":"HUN"
  },
  {
    "name":"Iceland",
    "code":"IS",
    "code-2":"ISL"
  },
  {
    "name":"India",
    "code":"IN",
    "code-2":"IND"
  },
  {
    "name":"Indonesia",
    "code":"ID",
    "code-2":"IDN"
  },
  {
    "name":"Iran",
    "code":"IR",
    "code-2":"IRN"
  },
  {
    "name":"Iraq",
    "code":"IQ",
    "code-2":"IRQ"
  },
  {
    "name":"Ireland",
    "code":"IE",
    "code-2":"IRL"
  },
  {
    "name":"Israel",
    "code":"IL",
    "code-2":"ISR"
  },
  {
    "name":"Italy",
    "code":"IT",
    "code-2":"ITA"
  },
  {
    "name":"Jamaica",
    "code":"JM",
    "code-2":"JAM"
  },
  {
    "name":"Japan",
    "code":"JP",
    "code-2":"JPN"
  },
  {
    "name":"Jordan",
    "code":"JO",
    "code-2":"JOR"
  },
  {
    "name":"Kazakhstan",
    "code":"KZ",
    "code-2":"KAZ"
  },
  {
    "name":"Kenya",
    "code":"KE",
    "code-2":"KEN"
  },
  {
    "name":"Kiribati",
    "code":"KI",
    "code-2":"KIR "
  },
  {
    "name":"Korea, North",
    "code":"KP",
    "code-2":"PRK"
  },
  {
    "name":"Korea, South",
    "code":"KR",
    "code-2":"KOR"
  },
  {
    "name":"Kosovo",
    "code":"XK",
    "code-2":"XKX"
  },
  {
    "name":"Kuwait",
    "code":"KW",
    "code-2":"KWT"
  },
  {
    "name":"Kyrgyzstan",
    "code":"KG",
    "code-2":"KGZ"
  },
  {
    "name":"Laos",
    "code":"LA",
    "code-2":"LAO"
  },
  {
    "name":"Latvia",
    "code":"LV",
    "code-2":"LVA"
  },
  {
    "name":"Lebanon",
    "code":"LB",
    "code-2":"LBN"
  },
  {
    "name":"Lesotho",
    "code":"LS",
    "code-2":"LSO"
  },
  {
    "name":"Liberia",
    "code":"LR",
    "code-2":"LBR"
  },
  {
    "name":"Libya",
    "code":"LY",
    "code-2":"LBY"
  },
  {
    "name":"Liechtenstein",
    "code":"LI",
    "code-2":"LIE"
  },
  {
    "name":"Lithuania",
    "code":"LT",
    "code-2":"LTU"
  },
  {
    "name":"Luxembourg",
    "code":"LU",
    "code-2":"LUX"
  },
  {
    "name":"Macedonia",
    "code":"MK",
    "code-2":"MKD"
  },
  {
    "name":"Madagascar",
    "code":"MG",
    "code-2":"MDG"
  },
  {
    "name":"Malawi",
    "code":"MW",
    "code-2":"MWI"
  },
  {
    "name":"Malaysia",
    "code":"MY",
    "code-2":"MYS"
  },
  {
    "name":"Maldives",
    "code":"MV",
    "code-2":"MDV"
  },
  {
    "name":"Mali",
    "code":"ML",
    "code-2":"MLI"
  },
  {
    "name":"Malta",
    "code":"MT",
    "code-2":"MLT"
  },
  {
    "name":"Marshall Islands",
    "code":"MH",
    "code-2":"MHL"
  },
  {
    "name":"Mauritania",
    "code":"MR",
    "code-2":"MRT"
  },
  {
    "name":"Mauritius",
    "code":"MU",
    "code-2":"MUS"
  },
  {
    "name":"Mexico",
    "code":"MX",
    "code-2":"MEX"
  },
  {
    "name":"Micronesia (Federated)",
    "code":"FM",
    "code-2":"FSM"
  },
  {
    "name":"Moldova",
    "code":"MD",
    "code-2":"MDA"
  },
  {
    "name":"Monaco",
    "code":"MC",
    "code-2":"MCO"
  },
  {
    "name":"Mongolia",
    "code":"MN",
    "code-2":"MNG"
  },
  {
    "name":"Montenegro",
    "code":"ME",
    "code-2":"MNE"
  },
  {
    "name":"Morocco",
    "code":"MA",
    "code-2":"MAR"
  },
  {
    "name":"Mozambique",
    "code":"MZ",
    "code-2":"MOZ"
  },
  {
    "name":"Myanmar",
    "code":"MM",
    "code-2":"MMR"
  },
  {
    "name":"Namibia",
    "code":"NA",
    "code-2":"NAM"
  },
  {
    "name":"Nauru",
    "code":"NR",
    "code-2":"NRU"
  },
  {
    "name":"Nepal",
    "code":"NP",
    "code-2":"NPL"
  },
  {
    "name":"Netherlands",
    "code":"NL",
    "code-2":"NLD"
  },
  {
    "name":"New Zealand",
    "code":"NZ",
    "code-2":"NZL"
  },
  {
    "name":"Nicaragua",
    "code":"NI",
    "code-2":"NIC"
  },
  {
    "name":"Niger",
    "code":"NE",
    "code-2":"NER"
  },
  {
    "name":"Nigeria",
    "code":"NG",
    "code-2":"NGA"
  },
  {
    "name":"Norway",
    "code":"NO",
    "code-2":"NOR"
  },
  {
    "name":"Oman",
    "code":"OM",
    "code-2":"OMN"
  },
  {
    "name":"Pakistan",
    "code":"PK",
    "code-2":"PAK"
  },
  {
    "name":"Palau",
    "code":"PW",
    "code-2":"PLW"
  },
  {
    "name":"Panama",
    "code":"PA",
    "code-2":"PAN"
  },
  {
    "name":"Papua New Guinea",
    "code":"PG",
    "code-2":"PNG "
  },
  {
    "name":"Paraguay",
    "code":"PY",
    "code-2":"PRY"
  },
  {
    "name":"Peru",
    "code":"PE",
    "code-2":"PER"
  },
  {
    "name":"Philippines",
    "code":"PH",
    "code-2":"PHL"
  },
  {
    "name":"Poland",
    "code":"PL",
    "code-2":"POL"
  },
  {
    "name":"Portugal",
    "code":"PT",
    "code-2":"PRT"
  },
  {
    "name":"Qatar",
    "code":"QA",
    "code-2":"QAT"
  },
  {
    "name":"Romania",
    "code":"RO",
    "code-2":"ROU"
  },
  {
    "name":"Russia",
    "code":"RU",
    "code-2":"RUS"
  },
  {
    "name":"Rwanda",
    "code":"RW",
    "code-2":"RWA"
  },
  {
    "name":"Saint Kitts and Nevis",
    "code":"KN",
    "code-2":"KNA "
  },
  {
    "name":"Saint Lucia",
    "code":"LC",
    "code-2":"LCA"
  },
  {
    "name":"Saint Vincent and the Grenadines",
    "code":"VC",
    "code-2":"VCT"
  },
  {
    "name":"Samoa",
    "code":"WS",
    "code-2":"WSM"
  },
  {
    "name":"San Marino",
    "code":"SM",
    "code-2":"SMR"
  },
  {
    "name":"Sao Tome and Principe",
    "code":"ST",
    "code-2":"STP"
  },
  {
    "name":"Saudi Arabia",
    "code":"SA",
    "code-2":"SAU"
  },
  {
    "name":"Senegal",
    "code":"SN",
    "code-2":"SEN"
  },
  {
    "name":"Serbia",
    "code":"RS",
    "code-2":"SRB"
  },
  {
    "name":"Seychelles",
    "code":"SC",
    "code-2":"SYC"
  },
  {
    "name":"Sierra Leone",
    "code":"SL",
    "code-2":"SLE"
  },
  {
    "name":"Singapore",
    "code":"SG",
    "code-2":"SGP"
  },
  {
    "name":"Slovakia",
    "code":"SK",
    "code-2":"SVK"
  },
  {
    "name":"Slovenia",
    "code":"SI",
    "code-2":"SVN"
  },
  {
    "name":"Solomon Islands",
    "code":"SB",
    "code-2":"SLB"
  },
  {
    "name":"Somalia",
    "code":"SO",
    "code-2":"SOM"
  },
  {
    "name":"South Africa",
    "code":"ZA",
    "code-2":"ZAF"
  },
  {
    "name":"South Sudan",
    "code":"SD",
    "code-2":"SDN"
  },
  {
    "name":"Spain",
    "code":"ES",
    "code-2":"ESP"
  },
  {
    "name":"Sri Lanka",
    "code":"LK",
    "code-2":"LKA"
  },
  {
    "name":"Sudan",
    "code":"SS",
    "code-2":"SSD"
  },
  {
    "name":"Suriname",
    "code":"SR",
    "code-2":"SUR"
  },
  {
    "name":"Swaziland",
    "code":"SZ",
    "code-2":"SWZ"
  },
  {
    "name":"Sweden",
    "code":"SE",
    "code-2":"SWE"
  },
  {
    "name":"Switzerland",
    "code":"CH",
    "code-2":"CHE"
  },
  {
    "name":"Syria",
    "code":"SY",
    "code-2":"SYR "
  },
  {
    "name":"Taiwan",
    "code":"TW",
    "code-2":"TWN"
  },
  {
    "name":"Tajikistan",
    "code":"TJ",
    "code-2":"TJK"
  },
  {
    "name":"Tanzania",
    "code":"TZ",
    "code-2":"TZA"
  },
  {
    "name":"Thailand",
    "code":"TH",
    "code-2":"THA"
  },
  {
    "name":"Togo",
    "code":"TG",
    "code-2":"TGO"
  },
  {
    "name":"Tonga",
    "code":"TO",
    "code-2":"TON"
  },
  {
    "name":"Trinidad and Tobago",
    "code":"TT",
    "code-2":"TTO"
  },
  {
    "name":"Tunisia",
    "code":"TN",
    "code-2":"TUN"
  },
  {
    "name":"Turkey",
    "code":"TR",
    "code-2":"TUR"
  },
  {
    "name":"Turkmenistan",
    "code":"TM",
    "code-2":"TKM"
  },
  {
    "name":"Tuvalu",
    "code":"TV",
    "code-2":"TUV "
  },
  {
    "name":"Uganda",
    "code":"UG",
    "code-2":"UGA"
  },
  {
    "name":"Ukraine",
    "code":"UA",
    "code-2":"UKR"
  },
  {
    "name":"United Arab Emirates",
    "code":"AE",
    "code-2":"ARE"
  },
  {
    "name":"United Kingdom",
    "code":"GB",
    "code-2":"GBR"
  },
  {
    "name":"United States of America",
    "code":"US",
    "code-2":"USA"
  },
  {
    "name":"Uruguay",
    "code":"UY",
    "code-2":"URY"
  },
  {
    "name":"Uzbekistan",
    "code":"ZU",
    "code-2":"UZB"
  },
  {
    "name":"Vanuatu",
    "code":"VU",
    "code-2":"VUT"
  },
  {
    "name":"Vatican City",
    "code":"VA",
    "code-2":"VAT"
  },
  {
    "name":"Venezuela",
    "code":"VE",
    "code-2":"VEN"
  },
  {
    "name":"Vietnam",
    "code":"VN",
    "code-2":"VNM"
  },
  {
    "name":"Yemen",
    "code":"YE",
    "code-2":"YEM"
  },
  {
    "name":"Zambia",
    "code":"ZM",
    "code-2":"ZMB"
  },
  {
    "name":"Zimbabwe",
    "code":"ZW",
    "code-2":"ZWE"
  }
] ;


countries = _.inject(countries, function(ret, val ) {
    ret[val.name] = val.code ;
    return ret
}, {}) ;


// Artist.find({legacy: { $exists: true }}).exec( function(err, res) {
//     res.forEach( function(artist) {
//          artist.state = 'active' ;
//          artist.save(function(err, res) {
//              console.log("saved");
//          } ) ;
//     }) ;
// }) ;


// Artist.find({legacy: { $exists: true }}).exec( function(err, res) {
//     res.forEach( function(artist) {
//          artist.country = countries[artist.contact.country.trim()] ;
//          artist.save(function(err, res) {
//              console.log("saved");
//          } ) ;
//     }) ;
// }) ;

function youtubeId(text) {
    var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
    return text.replace(re, '$1') ;
}


// Artist.find({legacy: { $exists: true }}).exec( function(err, res) {
//     res.forEach( function(artist) {
//         if( !artist.picture ) return ;
//         artist.picture = artist.picture.trim() ;
//          artist.save(function(err, res) {
//              console.log("saved");
//          } ) ;
//     }) ;
// }) ;


Song.find({}).exec( function(err, res) {
    res.forEach( function(song) {
        console.log((""+song.youtubeUrl).replace(/\'/g,''));
    }) ;
}) ;


// Artist.find({legacy: { $exists: true }}).exec( function(err, res) {
//     res.forEach( function(artist) {
//         if( !artist.picture ) return ;
//         artist.picture = artist.picture.replace("avatars/", "").trim() ;
//          artist.save(function(err, res) {
//              console.log("saved");
//          } ) ;
//     }) ;
// }) ;
//

/*
Artist.find({}).exec( function(err, res) {
    res.forEach( function(artist) {
        Song.aggregate( [
                        { $match : { artist: artist._id , state: 'active' } } ,
                        { $group: { _id: "$artist", plays: { $sum: "$plays" } } }
                       ] ).exec( function(err2, res) {
                            console.log(res);
                            if( !err && res.length > 0 ) {
                                artist.totalPlays = res[0].plays ;
                                artist.save(function(err3, artist) {
                                    console.log(artist._id);
                                }) ;
                            } else {
                                console.log(err2);
                            }
                       }) ;

    }) ;
}) ;

*/

// Song.find({legacy: { $exists: true }}).exec( function(err, res) {
//     res.forEach( function(song) {
//         if( song.youtubeUrl && (""+song.youtubeUrl).trim() != "" ) {
//             song.youtube = song.youtube || {} ;
//             song.youtube.id = youtubeId( ""+song.youtubeUrl ) ;
//             song.youtube.id = song.youtube.id.replace(/'/g, "") ;
//             song.save( function(err, res) {
//                 console.log("saved");
//             }) ;
//         }
//     }) ;
// }) ;
