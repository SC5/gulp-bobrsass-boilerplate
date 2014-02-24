var path = require('path'),
    util = require('util'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    inject = require('gulp-inject'),
    watch = require('gulp-watch'),
    concat = require('gulp-concat'),
    bower = require('gulp-bower'),
    browserify = require('gulp-browserify'),
    compass = require('gulp-compass'),
    jshint = require('gulp-jshint'),
    bump = require('gulp-bump'),
    livereload = require('gulp-livereload'),
    plumber = require('gulp-plumber'),
    clean = require('gulp-clean'),
    serve = require('gulp-serve'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    package = require('./package.json');

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
  version: package.version,
  debug: Boolean(gutil.env.debug),
};

// Package management
/* Install & update Bower dependencies */
gulp.task('install', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  bower();
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

// Cleanup
gulp.task('clean', function() {
  gulp.src('dist', { read: false })
    .pipe(clean());
});

/* Serve the web site */
gulp.task('serve', serve({
  root: 'dist',
  port: 8080
}));

gulp.task('javascript', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('bundle-%s.js', config.version),
      componentsPath = 'src/components',
      browserifyConfig = {
        debug: config.debug,
        shim: {
          jquery: {
            path: path.join(componentsPath, 'jquery/dist/jquery.js'),
            exports: 'jQuery'
          }
        }
      };

  return gulp.src('src/app/main.js', { read: false })
    // Compile
    // Unit test
    // Integrate (link, package, concatenate)
    .pipe(plumber())
    .pipe(browserify(browserifyConfig))
    .pipe(concat(bundleName))
    .pipe(gulpif(config.debug, uglify()))
    // Integration test
    .pipe(gulp.dest('dist'));
});

gulp.task('stylesheets', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('styles-%s.css', config.version);
  
  return gulp.src('src/css/styles.scss')
    .pipe(plumber())
    // Compile
    .pipe(compass({
        project: path.join(__dirname, 'src'),
        sass: 'css',
        css: '../temp/css'
    }))
    // Unit test
    // Integrate (link, package, concatenate)
    .pipe(concat(bundleName))
    // Integrate
    .pipe(gulp.dest('dist/css'));
    // Integration test
});

gulp.task('assets', function() {
  return gulp.src('src/assets/**')
    .pipe(gulp.dest('dist/assets'));
    // Integration test
});

gulp.task('clean', function() {
  gulp.src(['dist', 'temp'], { read: false })
    .pipe(clean());
});

gulp.task('integrate', ['javascript', 'stylesheets', 'assets'],  function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
    .pipe(inject('src/index.html', { ignorePath: ['/dist/'], addRootSlash: false }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', ['integrate'], function() {
  var server = livereload();
  
  // Watch the actual resources; Currently trigger a full rebuild
  gulp.watch(['src/css/**/*.scss', 'src/app/**/*.js', 'src/app/**/*.hbs', 'src/*.html'], ['integrate']);
  
  // Only livereload if the HTML (or other static assets) are changed, because
  // the HTML will change for any JS or CSS change
  gulp.src('dist/**', { read: false })
    .pipe(watch())
    .pipe(livereload());
});

gulp.task('default', ['integrate']);