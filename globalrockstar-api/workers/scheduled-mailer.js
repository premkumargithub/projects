'use strict';


if( !process.env.SEND_NOTIFICATIONS ) return ;

var agenda = require('../lib/agenda');
var Q = require('q'),
    models = require('../models'),
    db = require('../lib/database'),
    mongoose = require('mongoose') ;

var Contest = require('../models/contest');
var Vote = require('../models/vote');
var Song = require('../models/song');
var currentContest = require('../lib/get-current-contest') ;
var currentContestInCFE = require('../lib/get-current-contest-in-cfe') ;
var currentChartEntries = require('../lib/get-current-chartentries') ;
var Artist = require('../models/artist');
var Video = require('../models/video');
var config = require('../config');
var lodash = require('lodash') ;
var Fan = require('../models/fan') ;
var ChartEntry = require('../models/chart_entry') ;
var time;
var scheduledMailer = require('../mailer/schedule-mailer-template') ;


var schedule = [] ;
var frontendUrl = 'https://www.globalrockstar.com'


var currentContestId = '5391bc6069758716a25bb4a2' ;



schedule.push({
    name: 'automated-artist-nomination',
    query: function() {
        var dfd = Q.defer() ;
        
        Song.find({postNominated2: true }).populate('artist').
        exec(function(err, songs) {
            var artistIds = lodash.chain(songs).pluck( 'artist' ).uniq().value() ;
            
            dfd.resolve({
                _id: {
                    $in: artistIds
                }
            }) ;
            
        }) ;
        
        return dfd.promise ;
    },
    template: 'automated-artist-nomination',
    on: '',
    cta: function(artist) { return 'https://www.globalrockstar.com/artists/' + artist.slug ; },
    every: ''
}) ;



schedule.push({
    name: 'artist-notifier',
    query: function() {
        var dfd = Q.defer() ;
        dfd.resolve({ state: { $in: ['pending', 'active' ] } } ) ;
        return dfd.promise ;
    },
    template: 'artist-notifier',
    on: '',
    cta: function(artist) {
        return frontendUrl + "/artists/" + artist.slug ;
    },
    every: ''
}) ;


schedule.push({
    name: 'fan-notifier',
    model: 'fan',
    query: function() {
        var dfd = Q.defer() ;
        dfd.resolve({ state: { $in: ['pending', 'active' ] } } ) ;
        return dfd.promise ;
    },
    template: 'fan-notifier',
    on: '',
    cta: function(fan) {
        return frontendUrl + "/fans/" + fan.slug ;
    },
    every: ''
}) ;


schedule.push({
    name: 'contestants-notifier',
    query: function() {

        var dfd = Q.defer() ;

        Song.find({ contest: currentContestId, state: 'active' } ).exec( function(err, songs) {
            var artistIds = lodash.chain(songs).pluck('artist').uniq().value() ;
            return dfd.resolve({
                _id: {
                    $in: artistIds
                },
                state: 'active'
            }) ;
        }) ;

        return dfd.promise ;
    },
    template: 'contestants-notifier',
    on: '',
    cta: function(artist) {
        return frontendUrl + "/artists/" + artist.slug ;
    },
    every: ''
}) ;






schedule.push({
    name: 'eeh-test',
    query: function() {
        var dfd = Q.defer() ;
        dfd.resolve( { email: 'edgar.erich.hofmann@diamonddogs.cc' } ) ;
        return dfd.promise ;
    },
    template: 'eeh-test',
    on: '',
    cta: function(artist) {
        return frontendUrl + "/artists/verify/" + artist.verificationToken ;
    },
    every: ''
}) ;


schedule.push({
    name: 'gr-test',
    query: function() {
        var dfd = Q.defer() ;
        dfd.resolve( { email: new RegExp(/@globalrockstar.com/) } ) ;
        return dfd.promise ;
    },
    template: 'gr-test',
    on: '',
    cta: function(artist) {
        return frontendUrl + "/artists/verify/" + artist.verificationToken ;
    },
    every: ''
}) ;





schedule.push({
    name: 'artist-verification-reminder',
    query: function() {
        var dfd = Q.defer() ;
        dfd.resolve( { state: { $in :['active', 'pending'] }, verified: null } ) ;
        return dfd.promise ;
    },
    template: 'artist-verification-reminder',
    on: '',
    cta: function(artist) {
        return frontendUrl + "/artists/verify/" + artist.verificationToken ;
    },
    every: ''
}) ;


schedule.push({
    name: 'artist-completion-reminder',
    query: function() {
        var dfd = Q.defer() ;
        dfd.resolve( { isComplete: { $ne: true } } ) ;
        return dfd.promise ;
    },
    template: 'artist-completion-reminder',
    on: '',
    cta: function() { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/profile';  },
    every: ''
}) ;




schedule.push({
    name: 'artist-paypal-reminder',
    query: function() {
        var dfd = Q.defer() ;
        dfd.resolve({ paypal_email: { $exists: false } }) ;
        // dfd.resolve( { paypal_verified: { $ne: true } } ) ;
        return dfd.promise ;
    },
    template: 'artist-paypal-reminder',
    on: '',
    cta: function() { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/profile';  },
    every: ''
}) ;


//
// schedule.push({
//     name: 'contestants',
//     query: function() {
//         var dfd = Q.defer() ;
//         Song.find({ state: 'active', contest: { $ne: null } } ).exec( function(err, res) {
//             var artistIds = lodash.chain(res).pluck( 'artist' ).uniq().value() ;
//             dfd.resolve( { _id: { $in: artistIds } } ) ;
//         }) ;
//         return dfd.promise ;
//     },
//     template: 'artist-upload-reminder',
//     cta: function() { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/songs';  },
//     on: '',
//     every: ''
// }) ;



schedule.push({
    name: 'artist-video-reminder',
    query: function() {
        var dfd = Q.defer() ; 
        
        
        currentChartEntries(null, '_id artist')
        .then( function(chartEntries) {
            var artistIds = lodash.pluck( chartEntries, 'artist') ;
            var counter = 1 ;
            var artistWithoutVideo = [] ;
            
            artistIds = artistIds.filter( function(o) { return o != null ; } ) ;
            var artistLength = artistIds.length ;
            console.log(artistIds.length);
            artistIds.forEach( function(aid) {

                Video.count({state: { $nin: ['pending', 'active'] }, category: 'call', artist: aid }).exec( function(err, count) {
                    console.log(counter  + " - " + artistLength );
                    if( count == 0 ) {
                        artistWithoutVideo.push( aid ) ;
                    }
                    counter += 1 ;
                    if( counter == artistLength ) {
                        console.log("done");
                        console.log(artistWithoutVideo.length);
                        return dfd.resolve({
                            _id: {
                                $in: artistWithoutVideo
                            }
                        }) ;
                    }
                    
                })
            }) ;
            
        }).fail( function(err) { console.log(err);})

        return dfd.promise ;
    },
    template: 'artist-video-reminder',
    on: '',
    cta: function() { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/videos';  },
    every: ''
}) ;


schedule.push({
    name: 'artist-nomination-reminder',
    query: function() {
        var dfd = Q.defer() ;
        
        currentContestInCFE()
        .then( function(contest) {
            var artistIds = [] ;

            Artist.find({ state: { $in: ['active', 'pending'] }, isComplete: true, verified: { $exists: true } } ).select('_id').exec( function(err, artists) {
              var count = artists.length ;
              var counter = 0 ;
var artistCounter = 0 ;
              artists.forEach( function(artist) {
                artistCounter += 1 ;

                Q.all([
                  Q.ninvoke( Song, 'count', { state: { $in: ['active', 'pending'] }, youtubeUrl: { $exists: true }, contest: contest._id, artist: artist._id } ),
                  Q.ninvoke( Song, 'count', { state: { $in: ['active', 'pending'] }, youtubeUrl: { $exists: true }, contest: { $exists: false }, artist: artist._id } )
                ])
                .spread( function(nominatedSongs, notNominatedSongs) {
                  if( nominatedSongs == 0 && notNominatedSongs > 0 ) {
                    artistIds.push( artist._id ) ;
                  }

                  counter += 1 ;
                  if( counter == count ) {
                    dfd.resolve({ 
                      _id: {
                        $in: artistIds
                      }
                    }); 
                  }
                }).fail( function(err) { console.log(err); } )  ;

              }) ;
            }) ;
        })
        .fail( dfd.reject ) ;

        return dfd.promise ;
    },
    template: 'artist-nomination-reminder',
    on: '',
    cta: function() { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/songs';  },
    every: ''
}) ;


schedule.push({
    name: 'artist-completion-and-nomination-reminder',
    query: function() {
        var dfd = Q.defer() ;
        
        currentContestInCFE()
        .then( function(contest) {
            var artistIds = [] ;

            Artist.find({ state: { $in: ['active', 'pending'] }, isComplete: false, verified: { $exists: true } } ).select('_id').exec( function(err, artists) {
              var count = artists.length ;
              var counter = 0 ;

              artists.forEach( function(artist) {
                Q.all([
                  Q.ninvoke( Song, 'count', { state: { $in: ['active', 'pending'] }, contest: contest._id , artist: artist._id } ),
                  Q.ninvoke( Song, 'count', { state: { $in: ['active', 'pending'] }, youtubeUrl: { $exists: true }, contest: { $exists: false }, artist: artist._id } ),
                ]).spread( function(nominatedSongs, notNominatedSongs) {
                  if( nominatedSongs == 0 && notNominatedSongs > 0 ) {
                    artistIds.push( artist._id ) ;
                  }
                  counter +=1 ;
                  if( counter == count ) {
                    dfd.resolve({
                      _id: {
                        $in: artistIds
                      }
                    }); 
                  }
                }) ;

              }) ;
            }) ;
        })
        .fail( dfd.reject ) ;

        return dfd.promise ;
    },
    template: 'artist-completion-and-nomination-reminder',
    cta: function() { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/songs';  },
    on: '',
    every: ''
}) ;




schedule.push({
    name: 'artist-upload-reminder-when-audio',
    query: function() {
        var dfd = Q.defer() ;
        
        currentContestInCFE()
        .then( function(contest) {
            var artistIds = [] ;
            Artist.find({ state: { $in: ['active', 'pending'] },isComplete: true, verified: { $exists: true } } ).select('_id').exec( function(err, artists) {
              var count = artists.length ;
              var counter = 0 ;

              console.log(count) ; 
              artists.forEach( function(artist) {
                Q.all([
                  Q.ninvoke( Song, 'count', { state: { $in: ['active', 'pending'] }, artist: artist._id, contest: contest._id } ),
                  Q.ninvoke( Song, 'count', { state: { $in: ['active', 'pending'] }, artist: artist._id, contest: { $exists: false }, audiofile: { $exists: true } } ),
                  Q.ninvoke( Song, 'count', { state: { $in: ['active', 'pending'] }, artist: artist._id, contest: { $exists: false } } )
                ]).spread( function( nominatedSongs, notNominatedAudioSongs, notNominatedSongs ) {
                  counter += 1 ;
                  if( nominatedSongs == 0 && notNominatedAudioSongs > 0 && notNominatedSongs == notNominatedAudioSongs ) {
                    artistIds.push( artist._id ) ;
                  }
                  console.log(counter) ;
                  if( counter == count ) {
                    dfd.resolve({
                      _id: {
                        $in: artistIds
                      }
                    }); 
                  }
                }).fail( function(err) { console.log(err); } ) ;; 
            }); 
        }) ;
      })
      .fail( dfd.reject ) ;
      return dfd.promise ;
    },
    template: 'artist-upload-reminder-when-audio',
    cta: function(artist) { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/participate-contest' ; },
    on: '',
    every: ''
}) ;


schedule.push({
    name: 'artist-paypal-verification-reminder',
    query: function() {
        var dfd = Q.defer() ;
        
        dfd.resolve({
            paypal_verified: {
                $in: [null, false]
            }
        }) ;
        
        return dfd.promise ;
    },
    template: 'artist-paypal-verification-reminder',
    cta: function(artist) { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/participate-contest' ; },
    on: '',
    every: ''
}) ;


schedule.push({
    name: 'artist-rewards-reminder',
    query: function() {
      var dfd = Q.defer() ;
      
      currentContest()
      .then( function(_contest) {
        var songFinder = Song.find({ contest: _contest._id, state: { $in: ['active', 'pending'] }} ).select('artist') ;
        return Q.ninvoke( songFinder, 'exec' ) ;
      }).then( function(songs) {
        var artistIds = lodash.chain( songs ).pluck('artist').uniq().value() ;
        var counter = 0 ;
        var artistsWithoutRewards = [] ;
        artistIds.forEach( function(artist) {
          VotingPackage.count( { artist: artist }).exec( function(err, count) {
            if( count == 0 ) {
              artistsWithoutRewards.push( artist ) ;
            }
            counter += 1 ;
            if( counter == artistIds.length ) {
              dfd.resolve({
                _id: {
                  $in: artistsWithoutRewards
                }
              }) ;
            }

          }) ;
        }) ;
        
      }) ;

      return dfd.promise ;
    },
    template: 'artist-rewards-reminder',
    cta: function(artist) { return 'https://www.globalrockstar.com/account/login?redirect_to=/account/participate-contest' ; },
    on: '',
    every: ''
}) ;



var findActiveChartEntries = function() {
    return currentContest()
    .then( function(contest) {
        console.log(contest.name);
        var curPhase = contest.currentPhase.slice(-1)[0];
        if( curPhase == 'pause' ) {
            curPhase = contest.nextPhase[0] ;
        }
        console.log(contest._id + " - " + curPhase);
        var chartEntryFinder = ChartEntry.find({ contest: contest._id, phase: curPhase }).select('artist') ;
        
        return Q.ninvoke( chartEntryFinder, 'exec') ;
    }) ;
}



schedule.push({
    name: 'active-contestants-notifier',
    query: function() {
        
        var dfd = Q.defer() ;
        
        findActiveChartEntries()
        .then( function(chartEntries) {
            
            console.log(chartEntries.length) ;
            return ;
            
            var artistIds = lodash.chain(chartEntries).pluck( 'artist' ).uniq().value() ;
            
            dfd.resolve({
                _id: {
                    $in: artistIds
                }
            }) ;
        }).fail( function(err) {
            console.log(err);
            dfd.reject(err) ;
        }) ;
        
        
        return dfd.promise ;
        
    },
    template: 'active-contestants-notifier',
    cta: function(artist) { return 'https://www.globalrockstar.com/artists/' + artist.slug ; },
    on: '',
    every: ''
}) ;


schedule.push({
    name: 'inactive-contestants-notifier',
    query: function() {
        
        var dfd = Q.defer() ;
        
        currentContest()
        .then( function(contest) {
            var allChartEntriesFinder = ChartEntry.find( { contest: contest._id }).select('artist') ;
            
            return  Q.all([
                findActiveChartEntries(),
                Q.ninvoke( allChartEntriesFinder, 'exec' )
            ]) ;
        }).spread( function(activeChartEntries, allChartEntries) {
            var activeArtists = lodash.chain(activeChartEntries).pluck( 'artist' ).uniq().value() ;
            var artists = lodash.chain(allChartEntries).pluck( 'artist' ).uniq().value() ;
            
            dfd.resolve({
                _id: {
                    $in: artists,
                    $nin: activeArtists
                }
            }) ;
        }).fail( function(err) {
            dfd.reject(err) ;
        }) ;

        
        return dfd.promise ;
    },
    template: 'inactive-contestants-notifier',
    cta: function(artist) { return 'https://www.globalrockstar.com/artists/' + artist.slug ; },
    on: '',
    every: ''
}) ;

schedule.push({
    name: 'inactive-contestants-notifier-last-phase',
    query: function() {
        
        var dfd = Q.defer() ;
        
        currentContest()
        .then( function(contest) {
            
            var prevPhase = contest.previousPhase.slice(-1)[0] ;
            var previousChartEntryFinder = ChartEntry.find( { contest: contest._id, phase: prevPhase }).select('artist') ;

            return  Q.all([
                findActiveChartEntries(),
                Q.ninvoke( previousChartEntryFinder, 'exec' )
            ]) ;
        }).spread( function(activeChartEntries, previousChartEntries) {
            var activeArtists = lodash.chain(activeChartEntries).pluck( 'artist' ).uniq().value() ;
            var previous = lodash.chain(previousChartEntries).pluck( 'artist' ).uniq().value() ;

            dfd.resolve({
                _id: {
                    $in: previous,
                    $nin: activeArtists
                }
            }) ;
        }).fail( function(err) {
            dfd.reject(err) ;
        }) ;

        
        return dfd.promise ;
        
        
    },
    template: 'inactive-contestants-notifier-last-phase',
    cta: function(artist) { return 'https://www.globalrockstar.com/artists/' + artist.slug ; },
    on: '',
    every: ''
}) ;




var sendArtistNotifications = function(query, cta, done ) {

}


schedule.forEach( function( mailer, name ) {


    var jobName = "mail-notifications:" + mailer.name ;

    console.log(jobName) ;
    console.log(mailer);
    console.log("------------------------------------------");


    agenda.define( jobName, function(job, done) {

        console.log("+++++++++++ running job " + job.attrs.name );


        mailer.query()
        .then( function(query) {
            query.notifications = true ;

            var model = Artist ;
            if( mailer.model && mailer.model == 'fan' ) {
                model = Fan ;
            }
            
            var findModel = model.find( query ).select('_id name firstname lastname email slug picture') ;
            
            return Q.all([
                Q.ninvoke( model, 'count', query ),
                Q.ninvoke( findModel, 'exec' )
            ])
        })
        .spread( function(count, artists) {
            console.log("found: ", count);
            artists.forEach( function(artist) {
                console.log(artist);
                scheduledMailer( artist, mailer.template, mailer.cta( artist ) ) ;
            }) ;
            done() ;
        })
        .fail( function(err) {
            done(err) ;
        }) ;

    }) ;

}) ;


 //var scheduleName = process.argv[2] ;
 //var mailer = schedule.filter( function(mailer) { return mailer.name == scheduleName ; } ) ;
 
 //if( mailer[0] ) {
     //console.log( mailer[0] );
 
     //mailer[0].query()
     //.then( function(query) {
     ////    query.notifications = true ;
         //console.log(query);
         //var model = Artist ;
         //if( mailer[0].model && mailer[0].model == 'fan' ) {
             //model = Fan ;
         //}
         //return Q.all( [ Q.ninvoke( model, 'count', query ), Q.ninvoke( model, 'find', query ) ] ) ;
     //})
     //.spread( function( count, artists) {
         //artists.forEach( function(artist) {
              //console.log("%s;%s;%s;%s", artist.name, artist.email, artist.state, artist._id ) ;
              //// if( artist.email != 'christof.straub@globalrockstar.com' ) {
 ///////                  scheduledMailer( artist, mailer[0].template, mailer[0].cta( artist ) ) ;
              //// }
         //}) ;
         //console.log("found: " + count);
 //[>        var query = { email: "edgar.erich.hofmann@diamonddogs.cc" } ;
         //return Q.all( [ Q.ninvoke( Artist, 'count', query ), Q.ninvoke( Artist, 'find', query ) ] ) ;
     //})
     //.spread( function( count, artists) {
         //artists.forEach( function(artist) {
              //console.log("%s %s %s", artist.email, artist.state, artist.verified, mailer[0].cta( artist ) ) ;
              //scheduledMailer( artist, mailer[0].template, mailer[0].cta( artist ) ) ;
         //}) ;
         //console.log("found: " + count);*/
     //}).fail( console.log );
 //}
 ////
