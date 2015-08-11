var path = require('path') ;
var fs = require('fs') ;
var fs = require('graceful-fs') ;
var gm = require('gm') ;

var config = {
    imageFormats: {
        small: {
            width: 37,
            height: 37,
            quality: 50
        },
        small_x2: {
            width: 65,
            height: 65,
            quality: 50
        },
        medium: {
            width: 95,
            height: 95,
            quality: 50
        },
        profile: {
            width: 220,
            height: 220,
            quality: 70
        },
        big: {
            width: 350,
            height: 350,
            quality: 60
        },
        large: {
            width: 500,
            height: 500,
            quality: 70
        },
        project: {
            width: 678,
            height: 381,
            quality: 70
        }
    }
} ;


var files = fs.readdirSync('./pics/') ;

function convert(key) {
    if( !files.length ) return ;
        
    var file = files.pop() ;
    console.log(file);
    var outfile = "./pics2/" + path.basename(file, path.extname(file)) + "_" + key + path.extname(file) ;
    
    var size = config.imageFormats[key];

    var stream = gm('./pics/' + file)
        .resize(size.width * 2, (size.height * 2) + '')
        .thumbnail(size.width, size.height + '^')
        .gravity('center')
        .extent(size.width, size.height)
        .write( outfile, function(k) {
            console.log(k);
            convert(key) ;
        } ) ;
}

convert( 'small_x2' ) ;
//convert( 'big') ;
//convert( 'large' ) ;
// convert( 'medium' ) ;
// convert( 'profile' ) ;
