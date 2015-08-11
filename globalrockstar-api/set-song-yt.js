process.env.NODE_ENV = 'legacy' ;

var config = require("./config"),
    models = require('./models'),
    db = require('./lib/database'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    Hapi = require('hapi');

var Song = mongoose.model('Song') ;

function youtubeId(text) {
    var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
    return text.replace(re, '$1') ;
}

Song.find({}, function(err, res) {
    res.forEach( function(song) {
        if( song.legacy ) {

            var legacy = song.legacy ;

            if( !song.title || song.title === '') {
                song.title = "Untitled" ;
            }

            if( legacy.finalChart2013 && legacy.finalChart2013 !== "" )
                legacy.finalposition = parseInt( legacy.finalChart2013 ) ;

            if( legacy.nationalChart2013 && legacy.nationalChart2013 !== "" )
                legacy.nationalposition = parseInt( legacy.nationalChart2013 ) ;

            if( legacy.likes && legacy.likes !== "" )
                legacy.likesInt = parseInt( legacy.likes ) ;

            if( legacy.views && legacy.views !== "" )
                legacy.viewsInt = parseInt( legacy.views ) ;

            song.legacy = legacy ;

            console.log("updating legacy") ;
            console.log(song.legacy) ;

        }

        song.save(function(err, obj ) {
            console.log(obj._id) ;
        }) ;
    }) ;
}) ;


db.artists.find( { legacy: { $exists: 0 }, createdAt: { $lt: new ISODate('2014-07-29 00:00:04.311Z') } } ).forEach( function(obj) {
    obj.state = 'active' ;
    obj.verified = new ISODate() ;
    db.artists.save( obj ) ;
})


db.artists.find( { legacy: { $exists: 0 }, createdAt: { $gt: new Date('2014-07-29 00:00:04.311Z')} ).forEach( function(obj) {
    obj.state = 'active' ;
    obj.picture = obj.picture.trim() ;
    db.artists.save(obj);
});



db.songs.find({"legacy" : { $exists : true } } ).forEach( function(obj) {
    obj.picture = obj.picture.trim() ;
    db.songs.save(obj);
});

db.artists.find({"legacy" : { $exists : true } } ).forEach( function(obj) {
    obj.state = 'active' ;
    obj.picture = obj.picture.trim() ;
    db.artists.save(obj);
});


for f in *; do
     file=$(echo $f | sed -e 's/^ *//' -e 's/ *$//' )
    [ ! -f $file ] && mv "$f" $file
done



db.artists.find({ featured: 'on' } ).forEach( function(obj) {
    obj.featured_timestamp = obj.createdAt ;
    db.artists.save(obj) ;
}) ;



db.artists.find({"contact.country": "Syria" }).forEach( function(obj) {
    obj.country = "SY" ;
    obj.contact.country = "Syria" ;
    db.artists.save(obj) ;
}) ;

db.artists.find({"contact.country": "Moldova" }).forEach( function(obj) {
    obj.country = "MD" ;
    obj.contact.country = "Moldova" ;
    db.artists.save(obj) ;
}) ;


db.artists.find({"contact.country": "Moldova" }).forEach( function(obj) {
    obj.country = "AE" ;
    obj.contact.country = "United Arab Emirates" ;
    db.artists.save(obj) ;
}) ;



db.artists.find({country: { $exists: false }})

db.artists.find({country: { $exists: false }, 'contact.country': { $exists: true } })

db.songs.find({"legacy" : { $exists : true } } ).forEach( function(obj) {
    obj.createdAt = obj.legacy.createdAt ;
    if( obj.legacy.nationalChart2013 !== '' ) {
        obj.legacy.nationalChart2013 = new NumberInt( obj.legacy.nationalChart2013  );
    } else {
        obj.legacy.nationalChart2013 = null ;
    }
    db.songs.save(obj);
});
