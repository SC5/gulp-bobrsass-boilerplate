'use strict';

var bowerFiles = require('main-bower-files'),
    browserSync = require('browser-sync'),
    del = require('del'),
    eventStream = require('event-stream'),
    exec = require('exec-wait'),
    gulp = require('gulp'),
    path = require('path'),
    pkg = require('./package.json'),
    Promise = require('bluebird'),
    runSequence = require('run-sequence'),
    util = require('util'),
    $ = require('gulp-load-plugins')();

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
// jscs:disable requireMultipleVarDecl
// App config
var config = {
    version: pkg.version,
    port: process.env.PORT || pkg.config.port,
    hostname: process.env.HOSTNAME || pkg.config.hostname,
    debug: Boolean($.util.env.debug) || (process.env.NODE_ENV === 'development'),
    production: Boolean($.util.env.production) || (process.env.NODE_ENV === 'production')
  },
  // Test server URL (shared with server.js)
  url = ['http://', config.hostname + ':' + config.port, '/'].join(''),
  // Global vars used across the test tasks
  testServerCmdAndArgs = pkg.scripts.start.split(/\s/),
  phantomPath = path.dirname(require.resolve('phantomjs')),
  phantomCmd = path.resolve(phantomPath, require(path.join(phantomPath, 'location')).location),
  ghostDriver = exec({
    name: 'Ghostdriver',
    cmd: phantomCmd,
    args: ['--webdriver=4444', '--ignore-ssl-errors=true'],
    monitor: { stdout: 'GhostDriver - Main - running on port 4444' },
    log: $.util.log
  }),
  testServer = exec({
    name: 'Test server',
    cmd: testServerCmdAndArgs[0] + (process.platform === 'win32' ? '.cmd' : ''),
    args: testServerCmdAndArgs.slice(1),
    monitor: { url: url, checkHTTPResponse: false },
    log: $.util.log,
    stopSignal: 'SIGTERM'
  }),
  // Options for gulp-changed to track file changes
  changeOptions = { hasChanged: $.changed.compareSha1Digest };
// jscs:enable requireMultipleVarDecl

// Package management
/* Install & update Bower dependencies */
gulp.task('install', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  return $.bower();
});

gulp.task('clean', function(cb) {
  return del([
    'dist',
    // here we use a globbing pattern to match everything inside the `mobile` folder
    'temp'
  ], cb);
});

/* Bump version number for package.json & bower.json */
// TODO Provide means for appending a patch id based on git commit id or md5 hash
gulp.task('bump', function() {
  // Fetch whether we're bumping major, minor or patch; default to minor
  var env = $.util.env,
      type = (env.major) ? 'major' : (env.patch) ? 'patch' : 'minor';

  return gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({ type: type }))
    .pipe(gulp.dest('./'));
});

gulp.task('jscs', function() {
  return gulp.src(['src/app/**/*.js'])
    .pipe($.plumber())
    .pipe($.jscs());
});

gulp.task('jshint', function() {
  return gulp.src('src/app/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('javascript', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  // jscs:disable requireMultipleVarDecl
  var bundleName = util.format('bundle-%s.js', config.version);

  // Note: two pipes get combined together by first
  // combining components into one bundle, then adding
  // app sources, and reordering the items. Note that
  // we expect Angular to be the first item in bower.json
  // so that component concatenation works
  var components = gulp.src(bowerFiles())
    .pipe($.filter('**/*.js'))
    .pipe($.plumber());

  var templates = gulp.src(['src/app/**/*.html', '!src/index.html'])
    .pipe($.angularTemplatecache('templates.js', { standalone: true }));

  var app = gulp.src('src/app/**/*.js');

  return eventStream.merge(components, templates, app)
    .pipe($.order([
      'components/angular/angular.js',
      'components/**/*.js',
      'templates.js',
      'app/**/*.js'
    ], { base: path.join(__dirname, 'src') }))
    .pipe($.if(config.debug, $.sourcemaps.init()))
    .pipe($.concat(bundleName))
    .pipe($.if(!config.debug, $.ngAnnotate()))
    .pipe($.if(!config.debug, $.uglify()))
    .pipe($.if(config.debug, $.sourcemaps.write()))
    .pipe($.changed('dist', changeOptions))
    .pipe(gulp.dest('dist'));
});

gulp.task('stylesheets', function() {
  //jscs:disable requireMultipleVarDecl
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('styles-%s.css', config.version);

  // Pick all the 3rd party CSS and SASS, concat them into 3rd party
  // components bundle. Then append them to our own sources, and
  // throw them all through Compass
  var components = gulp.src(bowerFiles())
    .pipe($.filter(['**/*.css']))
    .pipe($.concat('components.css'));

  var app = gulp.src('src/app/styles.scss')
    .pipe($.plumber())
    .pipe($.if(config.debug, $.sourcemaps.init()))
    .pipe($.compass({
      project: __dirname,
      sass: 'src/app',
      css: 'temp/styles',
      bundle_exec: true
    }))
    .pipe($.concat('app.css'));
  //jscs:enable requireMultipleVarDecl

  return eventStream.merge(components, app)
    .pipe($.order([
      '**/components.css',
      '**/app.css'
    ]))
    .pipe($.concat(bundleName))
    .pipe($.if(!config.debug, $.csso()))
    .pipe($.if(config.debug,
      $.sourcemaps.write({ sourceRoot: path.join(__dirname, 'src/styles') }))
    )
    .pipe($.changed('dist/styles', changeOptions))
    .pipe(gulp.dest('dist/styles'))
    .pipe($.if(!config.production, $.csslint()))
    .pipe($.if(!config.production, $.csslint.reporter()));
});

gulp.task('assets', function() {
  return gulp.src('src/assets/**')
    // Due to file name match, using time delta with gulp-changed is alright
    .pipe($.changed('dist', changeOptions))
    .pipe(gulp.dest('dist/assets'));
    // Integration test
});

gulp.task('integrate', function() {
  var target = gulp.src('src/index.html'),
      source = gulp.src(['dist/*.js', 'dist/styles/*.css'], { read: false }),
      params = { ignorePath: ['/dist/'], addRootSlash: false };

  // Check whether to run tests as part of integration
  return target
    .pipe($.inject(source, params))
    .pipe($.changed('dist'), changeOptions)
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['build'], function() {
  var testOnWatch = Boolean(typeof $.util.env.test === 'undefined' ? false : true),
      lintOnWatch = Boolean(typeof $.util.env.nolint === 'undefined' ? true :  false);

  // Watch needs a test server to run; start that.
  return testServer.start()
    .then(function() {
      if (testOnWatch) {
        return ghostDriver.start();
      }
    })
    .then(function() {
      var integrationTasks = ['integrate'].concat((testOnWatch) ? ['test-run'] : []),
        jsTasks = (lintOnWatch ? ['jshint', 'jscs'] : []).concat(['javascript']);

      // Compose several watch streams, each resulting in their own pipe
      gulp.watch('src/app/**/*.scss', ['stylesheets']);
      gulp.watch(['src/app/**/*.js', 'src/app/**/*.html'], jsTasks);
      gulp.watch(['src/assets/**'], ['assets']);
      gulp.watch(['src/index.html'], ['integrate']);

      // Watch any changes to the dist directory
      gulp.watch(['dist/**/*.js', 'dist/**/*.css'], integrationTasks);

      $.util.log('Initialise BrowserSync on port 8081');
      browserSync.init({
        files: 'dist/**/*',
        proxy: [config.hostname, config.port].join(':'),
        port: 8081
      });
    });
});

gulp.task('test-setup', function() {
  return testServer.start()
    .then(ghostDriver.start)
    .then(function() {
      $.util.log('Servers started');
      // Hookup to keyboard interrupts, so that we will
      // execute teardown prior to exiting
      process.once('SIGINT', function() {
        $.util.log('SIGINT received, terminating test servers.');

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
  $.util.log('Running protractor');

  return new Promise(function(resolve) {
    gulp.src(['tests/*.js'])
    .pipe($.plumber())
    .pipe($.protractor.protractor({
      configFile: 'protractor.config.js',
      args: ['--seleniumAddress', 'http://localhost:4444/wd/hub',
             '--baseUrl', url]
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

// Task combinations
gulp.task('build', function() {
  return runSequence(['javascript', 'stylesheets', 'assets'], 'integrate');
});

gulp.task('default', ['build', 'test']);
