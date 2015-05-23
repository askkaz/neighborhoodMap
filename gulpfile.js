var gulp = require('gulp');
var jsmin = require('gulp-jsmin');
var rename = require('gulp-rename');
var minifyCss = require('gulp-minify-css');

gulp.task('default', function () {
    gulp.src('js-dev/app.js')
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('js/'));
});

gulp.task('minify-css', function() {
  return gulp.src('css-dev/style.css')
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(gulp.dest('css/'));
});