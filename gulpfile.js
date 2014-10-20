'use strict';

var path = require('path'),
    util = require('util'),
    gulp = require('gulp'),
    jscs = require('gulp-jscs'),
    $ = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    bowerFiles = require('main-bower-files'),
    eventStream = require('event-stream'),
    pkg = require('./package.json');

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
    version: pkg.version,
    debug: Boolean($.util.env.debug),
    production: Boolean($.util.env.production) || (process.env.NODE_ENV === 'production')
  },
  // Global vars used across the test tasks
  ghostDriver, testServer;

// Package management
/* Install & update Bower dependencies */
gulp.task('install', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  $.bower();
});

/* Bump version number for package.json & bower.json */
// TODO Provide means for appending a patch id based on git commit id or md5 hash
gulp.task('bump', function() {
  // Fetch whether we're bumping major, minor or patch; default to minor
  var env = $.util.env,
      type = (env.major) ? 'major' : (env.patch) ? 'patch' : 'minor';

  gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({ type: type }))
    .pipe(gulp.dest('./'));
});

gulp.task('build', function() {
  return runSequence(['javascript', 'stylesheets', 'assets'], 'integrate', 'test');
});

/* Serve the web site */
gulp.task('serve', $.serve({
  root: 'dist',
  port: 8080
}));

gulp.task('jscs', function(){
    return gulp.src(['src/app/**/*.js'])
        .pipe($.plumber())
        .pipe(jscs());
});

gulp.task('preprocess', function() {
  return gulp.src('src/app/**/*.js')
    .pipe($.cached('jslint'))
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('javascript', ['preprocess'], function() {
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
    .pipe($.plumber())
    .pipe($.browserify(browserifyConfig))
    .pipe($.concat(bundleName))
    .pipe($.if(!config.debug, $.uglify()))
    .pipe(gulp.dest('dist'));
});

gulp.task('stylesheets', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('styles-%s.css', config.version);

  // Pick all the 3rd party CSS and SASS, concat them into 3rd party
  // components bundle. Then append them to our own sources, and
  // throw them all through Compass
  var components = gulp.src(bowerFiles())
    .pipe($.filter(['**/*.css', '**/*.scss']))
    .pipe($.concat('components.css'));

  var app = gulp.src('src/css/styles.scss')
    .pipe($.plumber())
    .pipe($.compass({
      project: path.join(__dirname, 'src'),
      sass: 'css',
      css: '../temp/css'
    }))
    .pipe($.concat('app.css'));

  return eventStream.merge(components, app)
    .pipe($.order([
      '**/components.css',
      '**/app.css'
    ]))
    .pipe($.concat(bundleName))
    .pipe($.if(!config.debug, $.csso()))
    .pipe(gulp.dest('dist/css'))
    .pipe($.if(!config.production, $.csslint()))
    .pipe($.if(!config.production, $.csslint.reporter()));
});

gulp.task('assets', function() {

  return gulp.src('src/assets/**')
    .pipe($.cached('assets'))
    .pipe(gulp.dest('dist/assets'));
    // Integration test
});

gulp.task('clean', function(cb) {
  var del = require('del');

  del([
    'dist',
    // here we use a globbing pattern to match everything inside the `mobile` folder
    'temp'
  ], cb);
});

gulp.task('integrate', function() {
  var target = gulp.src('src/index.html'),
      source = gulp.src(['dist/*.js', 'dist/css/*.css'], { read: false }),
      params = { ignorePath: ['/dist/'], addRootSlash: false };

  return target
    .pipe($.inject(source, params))
    .pipe(gulp.dest('./dist'));
});

gulp.task('integrate-test', function() {
  return runSequence('integrate', 'test-run');
});

gulp.task('watch', ['integrate', 'test-setup'], function() {
  var browserSync = require('browser-sync');

  // Compose several watch streams, each resulting in their own pipe
  gulp.watch('src/css/**/*.scss', function() {
    return runSequence('stylesheets', 'integrate-test');
  });
  gulp.watch('src/app/**/*.js', function() {
    gulp.start('jscs');
    return runSequence('javascript', 'integrate-test');
  });
  gulp.watch(['src/assets/**','src/**/*.html'], function() {
    return runSequence('assets', 'integrate-test');
  });

  // Watch any changes to the dist directory
  $.util.log('Initialise BrowserSync on port 8081');
  browserSync.init({
    files: 'dist/**/*',
    proxy: 'localhost:8080',
    port: 8081
  });
});

gulp.task('test-setup', function() {
  var cmdAndArgs = pkg.scripts.start.split(/\s/),
      cmdPath = path.dirname(require.resolve('phantomjs')),
      cmd = path.resolve(cmdPath, require(path.join(cmdPath, 'location')).location),
      exec = require('exec-wait'),
      Promise = require('bluebird');

  ghostDriver = exec({
    name: 'Ghostdriver',
    cmd: cmd,
    args: ['--webdriver=4444', '--ignore-ssl-errors=true'],
    monitor: { stdout: 'GhostDriver - Main - running on port 4444' },
    log: $.util.log
  });
  testServer = exec({
    name: 'Test server',
    cmd: cmdAndArgs[0] + (process.platform === 'win32' ? '.cmd' : ''),
    args: cmdAndArgs.slice(1),
    monitor: { url: 'http://localhost:8080/', checkHTTPResponse: false },
    log: $.util.log,
    stopSignal: 'SIGTERM'
  });

  return testServer.start()
    .then(ghostDriver.start)
    .then(function() {
      // Hookup to keyboard interrupts, so that we will
      // execute teardown prior to exiting
      process.once('SIGINT', function() {
        return ghostDriver.stop()
          .then(testServer.stop)
          .then(function() {
            process.exit();
          });
      });
      return Promise.resolve();
    });
});

gulp.task('test-run', function() {
  var Promise = require('bluebird');
  $.util.log('Running protractor');

  return new Promise(function(resolve) {
    gulp.src(['tests/*.js'])
    .pipe($.plumber())
    .pipe($.protractor.protractor({
      configFile: 'protractor.config.js',
      args: ['--seleniumAddress', 'http://localhost:4444/wd/hub',
             '--baseUrl', 'http://localhost:8080/']
    }))
    .on('end', function() {
      resolve();
    })
    .on('error', function() {
      resolve();
    });
  });
});

gulp.task('test-teardown', function() {
  return ghostDriver.stop()
    .then(testServer.stop);
});

gulp.task('test', function() {
  return runSequence('test-setup', 'test-run', 'test-teardown');
});

gulp.task('default', ['jscs', 'build']);
