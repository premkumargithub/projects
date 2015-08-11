process.env.NODE_ENV = 'legacy' ;

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash') ,
    request = require('request'),
    Hapi = require('hapi'),
    fs = require('fs') ;

console.log(config) ;

var Fan = mongoose.model('Fan') ;
var csv = require('fast-csv') ;

var stream = fs.createReadStream("./_legacy/fans.csv");

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
    "name":"China",
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

var ccc = 0 ;
var cc2 = 0 ;

// user_id,"first_name","last_name","nickname","user_email","user_gender","user_country","user_avatar","facebook user id"
var csvStream = csv({delimiter:','})
 .on("record", function(data){


    var userId      = data[0].trim() ;
    var firstname   = data[1].trim() ;
    var lastname    = data[2].trim() ;
    var nickname    = data[3].trim() ;
    var email       = data[4].trim() ;
    var gender      = data[5].trim() ;
    gender = gender == '' ? 'prefer_not_to_say' : gender.indexOf('Male') >= 0 ? 'male' : 'female' ;
    var country     = data[6].trim() ;
    var avatar      = data[7].trim() ;
    var fbId        = data[8].trim() ;


    firstname = (firstname == null || firstname == '') ? nickname : nickname ;
    lastname = (lastname == null || lastname == '') ? '       ' : lastname ;

    var payload = {
        legacy: {
            id: userId
        },
        firstname: firstname ,
        lastname: lastname,
        email: email,
        country: countries[ country ],
        gender: gender,
        facebookId: fbId,
        picture: avatar
    } ;


    Fan.count({'legacy.id': userId}, function(err, count) {
        if( count > 0 ) return ;

//        console.log("new Fan " + userId + " " + payload.country + "'"  ) ;



        var fan = new Fan( payload ) ;

        fan.save(function(err, res) {
             if(err) {
                // console.log("ERRRR: ");
                // console.log(userId + " - " + fan.email) ;
                return ;
             }
             console.log(res._id);

/*
            if( avatar == null || avatar.trim().replace(/\s/g, '').length == 0 )return ;
            var imgUrl = avatar ;

            if( imgUrl.indexOf('var/www/global-rockstar.com/') >= 0 ) {
               imgUrl = avatar.trim().replace('var/www/global-rockstar.com/', '')
            }

            if( imgUrl.indexOf('global-rockstar.com') < 0 ) {
               imgUrl = "http://www.global-rockstar.com/wp-content/uploads" + avatar.trim() ;
            }

            var filename = res._id + "_" + avatar.split("/").slice(-1)[0] ;
            filename = "./avatars/" + filename ;
            request(imgUrl).pipe(fs.createWriteStream(filename)).on('close', function() {
                fan.picture =  "" + res._id + "_" + avatar.split("/").slice(-1)[0] ;
                fan.save( function(err, res) {
                    console.log('done image');
                }) ;
            }) ;
*/


         }) ;

    }) ;





    //console.log(payload);



    return ;


/*
    var genres = data[9] ;
    genres = genres ? genres.split(",") : [] ;

    var gender = data[5] ;
    gender = gender == '' ? 'prefer_not_to_say' : gender.indexOf('Male') >= 0 ? 'male' : 'female' ;
    var userId = data[0].trim() ;

    if( userId == 'bla')return ;

    var payload = {
      legacy: {
        id: data[0],
        firstname: data[1].trim(),
        lastname: data[2].trim(),
        gender: data[5],
        description: data[8].trim(),
        twitter: data[10].trim(),
        user_avatar: data[11].trim(),
        user_zip: data[12].trim(),
        user_age: data[13].trim(),
        facebook_user_id: (data[19] || "").trim(),
        createdAt: new Date( data[18] )
    },
      verified: new Date(),
      name: data[3].trim(),
      email: data[4].trim(),
      country: countries[data[6].trim()],
      city: data[7].trim(),
      genres_music: genres,
      facebook: data[14].trim(),
      twitter: data[15].trim(),
      youtube: data[16].trim(),
      createdAt: new Date( data[18] ),
      state: 'active',
      website: data[17].trim(),
      contact: {
          first_name: data[1].trim(),
          last_name: data[2].trim(),
          gender: gender,
          postal_code: data[12].trim(),
          city: data[7].trim(),
          country: data[6].trim(),
          birthdate: new Date(data[13])
      },
      birthdate: new Date( data[13] )
    };


    Artist.count({'legacy.id': userId}, function(err, count) {
        if( count > 0 ) return ;

        console.log("new artist " + userId + " " + payload.country + "'"  ) ;
        var artist = new Artist( payload ) ;

        artist.save(function(err, res) {
             if(err) {
                 console.log("ERRRR: ");
                console.log(err) ;
                console.log(data[0]);
                return ;
             }

             if( data[11] == null || data[11].trim().replace(/\s/g, '').length == 0 )return ;
             var imgUrl = data[11] ;

            if( imgUrl.indexOf('var/www/global-rockstar.com/') >= 0 ) {
                imgUrl = data[11].trim().replace('var/www/global-rockstar.com/', '')
            }

            if( imgUrl.indexOf('global-rockstar.com') < 0 ) {
                imgUrl = "http://www.global-rockstar.com/wp-content/uploads" + data[11].trim() ;
            }

            console.log(imgUrl);
             var filename = res._id + "_" + data[11].split("/").slice(-1)[0] ;
             filename = "./avatars/" + filename ;
             request(imgUrl).pipe(fs.createWriteStream(filename)).on('close', function() {
                 artist.picture =  "avatars/" + res._id + "_" + data[11].split("/").slice(-1)[0] ;
                 artist.save( function(err, res) {
                     console.log('done image');
                 }) ;
             }) ;
         }) ;

    }) ;
*/


 })
 .on("end", function(){
     console.log("done");
 });


stream.pipe(csvStream);
