var path = require('path'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    inject = require('gulp-inject'),
    concat = require('gulp-concat'),
    bower = require('gulp-bower'),
    lazypipe = require('lazypipe'),
    browserify = require('gulp-browserify'); 
    jshint = require('gulp-jshint'),
    bump = require('gulp-bump'),
    rev = require('gulp-rev'),
    sass = require('gulp-sass'),
    filelog = require('gulp-filelog'),
    livereload = require('gulp-livereload'),
    package = require('./package.json');

/* Configurations */
var config = {
  version: package.version,
  jsRoot: ['main-', package.version ,'.js'].join(''),
};

/* Install & update dependencies */
gulp.task('update', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  bower('./src/components');
});

/* Bump version number for package.json & bower.json */
// TODO Provide means for appending a patch id based on git commit id or md5 hash
gulp.task('bump', function(){
  // Fetch whether we're bumping major, minor or patch; default to minor
  var env = gutil.env,
      type = (env.major) ? 'major' : (env.patch) ? 'patch' : 'minor';

  gulp.src(['./bower.json', './package.json'])
    .pipe(bump({ type: type }))
    .pipe(gulp.dest('./'));
});

gulp.task('javascript', function() {
  return gulp.src('src/app/**/*.js')
    // Compile
    // Unit test
    // Link & package
    .pipe(browserify())
    .pipe(concat('bundle.js'))
    .pipe(rev())
    // Integrate
    // Integration test
    .pipe(gulp.dest('dist'));
});

gulp.task('stylesheets', function() {
  return gulp.src('src/css/**/*.scss')
    // Compile
    // Unit test
    .pipe(sass())
    .pipe(rev())
    // Integrate
    .pipe(gulp.dest('dist/css'));
    // Integration test
});

gulp.task('integrate', ['javascript', 'stylesheets'],  function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
      .pipe(inject('src/index.html'))
      .pipe(gulp.dest('./dist'));
});

gulp.task('rebuild', ['html', 'javascript', 'stylesheets'], function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
    .pipe(inject('src/index.html'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function() {
  var server = livereload();
  
  // Watch the actual resources; Currently trigger a full rebuild
  gulp.watch('src/css/**/*.scss', ['stylesheets']);
  gulp.watch('src/app/**/*.js', ['javascript']);
  gulp.watch('src/*.html', ['html']);
  
  // Only livereload if the HTML (or other static assets) are changed, because
  // the HTML will change for any JS or CSS change
  gulp.watch('dist/*', function(evt) {
    livereload().changed(evt.path);
  });
});

gulp.task('default', ['integrate']);