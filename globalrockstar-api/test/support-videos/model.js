'use strict';


var config = require('../../lib/database'),
    models = require('../../models') ;


var should = require('should'),
mongoose = require('mongoose'),
Video = mongoose.model('Video'),
Artist = mongoose.model('Artist'),
chai = require('chai'),
slug = require('slug'),
expect = chai.expect ;
var ObjectId = mongoose.Types.ObjectId ;

var video, artist ;
var server = require('../../server') ;

describe('Video Model', function() {
    before(function(done) {
        Video.find({}).remove() ;
        Artist.find({}).remove() ;
        video = new Video({
            youtubeUrl: 'some youtube url',
            title: 'some video title'
        });

        // Clear artists before testing
        Video.remove().exec();
        done();
    });

    after( function(done) {
        Video.find({}).remove() ;
        Artist.find({}).remove() ;

        done() ;
    }) ;

    afterEach(function(done) {
        // Video.remove().exec() ;
        //Project.remove().exec();
        //Video.remove.exec() ;
        Artist.remove() ;
        done();
    });
    beforeEach(function(done) {
        // Video.remove().exec() ;
        //Project.remove().exec();
        //Video.remove.exec() ;
        Artist.remove() ;
        done();
    });

    it('should begin with no support-videos', function(done) {
        Video.find({}, function(err, videos) {
            videos.should.have.length(0);
            done();
        });
    });

    it('should save a video', function(done) {
        video.save(function(err,p) {
            Video.find({}, function(err, c) {
                expect(c.length).to.equal(1) ;
                done() ;
            })
        });
    });



    /*it('should get youtube meta information', function(done) {
        var youtubeUrl = 'http://www.youtube.com/watch?v=9GkVhgIeGJQ' ;
        video.loadYoutubeMeta( youtubeUrl, function(err, obj ) {
            expect(obj.youtube.id).to.equal('9GkVhgIeGJQ') ;
            expect(obj.youtube.duration).to.equal(175) ;
            expect(obj.youtube.uploader).to.equal('thecurevevo') ;
            expect(obj.youtube.thumbnails.length).to.equal(2) ;
            done() ;
        }) ;
    }) ;*/


    it('should associate a video with an artist', function(done) {
        var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        artist = new Artist({
            provider: 'local',
            name: username,
            email:  username + '@test.com',
            password: 'password123456',
            password_confirmation: 'password123456',
            toc: true,
            newsletter: true
        });

        artist.save(function(err,an) {
            expect(err).to.not.exist ;
            video.artist = an._id ;
            video.save(function(err,pn) {
                expect(err).to.not.exist ;
                Video.findOne( { artist: an._id }, function(err, pnn) {
                    expect(err).to.not.exist ;
                    expect(pnn.id).to.equal(pn.id) ;
                    done() ;
                }) ;
            }) ;
        }) ;
    });


    
    
    it('should generate slug from title', function(done) {
    
        var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        var slugArtist = new Artist({
            provider: 'local',
            name: username,
            email: username + '@test.com',
            password: 'password123456',
            password_confirmation: 'password123456'
        });
    
        slugArtist.save(function(err, savedArtist) {
            should.not.exist(err);
            savedArtist.slug.should.equal(slug(slugArtist.name)) ;
            done();
        });
    });
    
    
 /*   it('should fail when password confirmation does not match', function(done) {
        var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        var newArtist = new Artist({
            provider: 'local',
            name: username,
            email:  username + '@test.com',
            password: 'password123456',
            password_confirmation: 'password123456',
            toc: true,
            newsletter: true
        });
        newArtist.password_confirmation = "buha";
        newArtist.save(function(err) {
            should.exist(err);
            done();
        });
    });*/
    
    it("should authenticate artist if password is valid", function(done) {
        artist.authenticate(artist.email, function(err,obj) {
            should.exist( obj ) ;
            done() ;
        }) ;
    });
    
    it("should not authenticate artist if password is invalid", function(done) {
        artist.authenticate("123", function(err, obj) {
            obj.should.equal(false) ;
            done() ;
        }) ;
    });
    
    
    
    /*it('should fail when saving without a password', function(done) {
        artist.password = '';
        
        artist.save(function(err) {
            should.exist(err);
            done();
        });
    });*/
    
    /*
    it('should fail when saving without a name', function(done) {
        artist.name = '';
        artist.save(function(err) {
            should.exist(err);
            done();
        });
    });*/
    
    
    it('should generate a verification token on create', function(done) {
        var username = 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        var slugArtist = new Artist({
            provider: 'local',
            name: username,
            email: username + '@test.com',
            password: 'password123456',
            password_confirmation: 'password123456'
        });
    
        slugArtist.save(function(err, savedFan) {
            should.not.exist(err) ;
            should.exist(savedFan.verificationToken) ;
            done();
        });
    
    }) ;
    
    
    it('should fail when email is not a real email', function(done) {
    
        artist.name = 'dsfdsdfsd';
        artist.email = 'this is not the email you are looking for'
        artist.save(function(err) {
            should.exist(err);
            done();
        });
    
    }) ;
    


});