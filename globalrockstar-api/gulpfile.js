var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    stylish = require('gulp-jscs-stylish'),
    cleanup = require('gulp-clean'),
    jsdoc = require('gulp-jsdoc'),
    mocha = require('gulp-mocha'),
    checkstyleReporter = require('gulp-jshint-checkstyle-reporter');

var paths = {
    // All tests
    // controller_tests: ['test/project/controller.js'],
    // model_tests: ['test/project/model.js'],

    controller_tests: ['test/artists/controller.js', 'test/songs/controller.js', 'test/album/controller.js', 'test/videos/controller.js'],
    model_tests: ['test/artists/model.js', 'test/songs/model.js', 'test/album/model.js',  'test/videos/model.js'],



    // Prem's tests
    //controller_tests: ['test/physical-products/controller.js', 'test/activities/controller.js', 'test/comments/controller.js', 'test/artists/controller.js', 'test/support_tickets/controller.js', 'test/slider/controller.js', 'test/contest/controller.js', 'test/artist-statistics/controller.js', 'test/songs/controller.js', 'test/project/controller.js'],
    //model_tests: ['test/artists/model.js', 'test/artist-statistics/model.js', 'test/slider/model.js', 'test/votes/model.js', 'test/videos/model.js'],
    scripts: ['controllers/**/*.js', 'models/**/*.js', 'routes/**/*.js', 'config/**/*.js'],
    jsdocpath: ['controllers/**/*.js', 'models/**/*.js', 'routes/**/*.js', 'config/**/*.js', 'lib/**/*.js']
};

gulp.task('lint', function () {
    gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(checkstyleReporter())
        .pipe(gulp.dest('checkstyle-reports'));
});

gulp.task('dev-lint', function () {
    gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));

    gulp.src(paths.scripts)
        .pipe(jscs({configPath: '.jscsrc'}))        // enforce style guide
        .on('warning', function () {
            process.exit(1);                        // Stop on error
        })
        .pipe(stylish());
});

gulp.task('nodemon', function () {
    nodemon({script: 'index.js', ext: 'html js', ignore: ['public/*']})
        .on('change', ['lint'])
        .on('restart', function () {
            console.log('restarted!');
        });
});

//Define the task for testing the API test cases and model schemas
gulp.task('mocha', function () {
    gulp.src(paths.controller_tests.concat(paths.model_tests))
        .pipe(mocha({reporter: 'spec'}));
});

gulp.task('watch-mocha', function () {
    gulp.watch(paths.controller_tests.concat(paths.model_tests), ['mocha']);
});

gulp.task('clean-doc', function () {
    return gulp.src('docs', {read: false})
        .pipe(cleanup());
});

gulp.task('doc', ['clean-doc'], function () {
    return gulp.src(paths.jsdocpath)
        .pipe(jsdoc('docs'));
});

// The default task (called when you run `gulp` from cli) *
gulp.task('default', ['nodemon']);

//The Test cases task : Called when you type 'gulp test'
//Used to run the Controller mocks(API test cases), and Model DB schema

gulp.task('test', ['watch-mocha']);
gulp.task('docs', ['doc']);
