process.env.NODE_ENV = 'legacy' ;

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    Hapi = require('hapi');

console.log(config) ;

var transform = require('stream-transform') ;

var Artist = mongoose.model('Artist') ;
var fs = require('fs') ;

var csv = require('fast-csv') ;

var stream = fs.createReadStream("./_legacy/artists.csv");
var request = require('request') ;


var fs = require('fs'),
    request = require('request');


//user_id,"first_name","last_name","nickname","user_email","user_gender","user_country","user_city","description","genre","twitter","user_avatar","user_zip",
// "user_age","user_facebook","user_twitter","user_youtube","user_website","user_registered","facebook user id"

var csvStream = csv({delimiter:','})
 .on("record", function(data){

    var genres = data[9] ;
    genres = genres ? genres.split(",") : [] ;

    var gender = data[5] ;
    gender = gender == '' ? 'prefer_not_to_say' : gender == 'Male' ? 'male' : 'female' ;

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
        facebook_user_id: data[19].trim(),
        createdAt: new Date( data[18] )
    },
      verified: new Date(),
      name: data[3].trim(),
      email: data[4].trim(),
      country: data[6].trim(),
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

    var artist = new Artist( payload ) ;

    artist.save(function(err, res) {
         if(err) {
             console.log("ERRRR: ");
            console.log(err) ;
            console.log(data[0]);
            return ;
         }

//         console.log('saved') ;
         if( data[11] == null || data[11].trim().replace(/\s/g, '').length == 0 )return ;

         var imgUrl = data[11] ;



        if( imgUrl.indexOf('/var/www/global-rockstar.com') < 0 ) {
            imgUrl = data[11].trim().replace('/var/www/', 'http://')
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


      //   console.log(payload);
 })
 .on("end", function(){
     console.log("done");
 });


stream.pipe(csvStream);

//user_id	first_name	last_name	nickname	user_email	user_gender	user_country	user_city	description	genre	twitter	user_avatar	user_zip	user_age	user_facebook	user_twitter	user_youtube	user_website	facebook user id

// name: String,
// email: {
//     type: String,
//     unique: true,
//     index: true,
//     validate: validator.isEmail,
//     lowercase: true,
//     trim: true
// },
// hashedPassword: String,
// salt: String,
// terms: { type: Boolean, default: false },
// newsletter: { type: Boolean, default: false },
// notifications: { type: Boolean, default: true },
// activitystream: { type: Boolean, default: true },
// arena: { type: String, default: 'video' },
// currency: { type: String, default: 'euro' },
// facebookId: { type: String, index: true },
// provider: String,
// facebook: String,
// youtube: String,
// twitter: String,
// website: String,
// biography: String,
// city: String,
// country: String,
// message: String,
// genres_music: [String],
// birthdate: Date,
// genres_own: [String],
// picture: String,
// contact: {
//     first_name: String,
//     last_name: String,
//     gender: String,
//     address: String,
//     postal_code: String,
//     country: String,
//     telephone: String,
//     city: String,
//     birthdate: Date
// },
// paypal_email: String,
// featured: { type: Boolean, default: false },
// verificationToken: {
//     type: String,
//     unique: true,
//     index: true,
//     default: function() { return uuid.v1(); }
// },
// verified: Date,
// state: { type: String, enum: ['active', 'deleted', 'inactive', 'pending'], default: 'pending' },
// isComplete: { type: Boolean, default: false },
// projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
// fans: [{ type: Schema.Types.ObjectId, ref: 'Fan' }],
// fans_a: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
// stateHistory: [StateHistory],
// totalPlays: {type: Number, default: 0 },
// currentLoginTimestamp: Date,
// lastLoginTimestamp: Date,
// lastLoginIP: String,
// currentLoginIP: String
// });
