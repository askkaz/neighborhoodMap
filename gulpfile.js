var gulp = require('gulp');

var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var cdnizer = require("gulp-cdnizer");

var bases = {
 dist: 'dist/',
 app: ''
};

var paths = {
 scripts: ['js/app.js'],
 styles: ['css/style.css'],
 html: ['index.html'],
 extras: ['README.md', 'resources.txt'],
};

// Delete the dist directory
gulp.task('clean', function() {
 return gulp.src(bases.dist)
 .pipe(clean());
});

// Process scripts and concatenate them into one output file
gulp.task('scripts', ['clean'], function() {
 gulp.src(paths.scripts, {cwd: bases.app})
 .pipe(jshint())
 .pipe(jshint.reporter('default'))
 .pipe(uglify())
 .pipe(concat('app.js'))
 .pipe(gulp.dest(bases.dist + 'js/'));
});

gulp.task('css',['clean'],function(){
	gulp.src(paths.styles, {cwd: bases.app})
	.pipe(minifyCss({compatibility: 'ie8'}))
	.pipe(gulp.dest(bases.dist + 'css/'));
});
// Copy all other files to dist directly
gulp.task('copy', ['clean'], function() {
 // Copy html
 gulp.src(paths.html, {cwd: bases.app})
 .pipe(gulp.dest(bases.dist));

 // Copy extra html5bp files
 gulp.src(paths.extras, {cwd: bases.app})
 .pipe(gulp.dest(bases.dist));
});
gulp.task('cdn',['clean'],function(){
gulp.src("index.html")
        .pipe(cdnizer([
            {

                file: 'js/jquery-2.1.3.min.js',
                cdn: 'google:jquery@2.1.3'
            }
        ]))
        .pipe(gulp.dest(bases.dist));
});


// Define the default task as a sequence of the above tasks
gulp.task('default', ['clean', 'scripts', 'css', 'cdn','copy']);