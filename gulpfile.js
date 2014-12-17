'use strict';

var path = require('path'),
    util = require('util'),
    gulp = require('gulp'),
    exec = require('exec-wait'),
    $ = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    bowerFiles = require('main-bower-files'),
    eventStream = require('event-stream'),
    pkg = require('./package.json');

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
// jscs:disable requireMultipleVarDecl
var config = {
    version: pkg.version,
    debug: Boolean($.util.env.debug) || (process.env.NODE_ENV === 'development'),
    production: Boolean($.util.env.production) || (process.env.NODE_ENV === 'production')
  },
  port = Number(process.env.PORT || 8080),
  hostName = process.env.HOSTNAME || 'localhost',
  host = [hostName, port].join(':'),
  url = ['http://', host, '/'].join(''),
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
  });
// jscs:enable requireMultipleVarDecl

// Package management
/* Install & update Bower dependencies */
gulp.task('install', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  return $.bower();
});

gulp.task('clean', function(cb) {
  var del = require('del');

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

/* Serve the web site */
gulp.task('serve', $.serve({
  root: 'dist',
  port: port
}));

gulp.task('jscs', function() {
  return gulp.src(['src/app/**/*.js'])
    .pipe($.cached('jscs'))
    .pipe($.plumber())
    .pipe($.jscs());
});

gulp.task('jshint', function() {
  return gulp.src('src/app/**/*.js')
    .pipe($.cached('jslint'))
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('javascript', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('bundle-%s.js', config.version),
      browserifyConfig = {
        debug: config.debug,
        shim: {
          jquery: {
            path: 'src/components/jquery/dist/jquery.js',
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

  var app = gulp.src('src/styles/styles.scss')
    .pipe($.plumber())
    .pipe($.if(config.debug, $.sourcemaps.init()))
    .pipe($.compass({
      project: __dirname,
      sass: 'src/styles',
      css: 'temp/styles'
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
    .pipe(gulp.dest('dist/styles'))
    .pipe($.if(!config.production, $.csslint()))
    .pipe($.if(!config.production, $.csslint.reporter()));
});

gulp.task('assets', function() {
  return gulp.src('src/assets/**')
    .pipe($.cached('assets'))
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
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', ['build'], function() {
  var browserSync = require('browser-sync'),
    testOnWatch = Boolean(typeof $.util.env.test === 'undefined' ? false : true),
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
      gulp.watch('src/styles/**/*.scss', ['stylesheets']);
      gulp.watch('src/app/**/*.js', jsTasks);
      gulp.watch(['src/assets/**', 'src/**/*.html'], ['assets']);

      // Watch any changes to the dist directory
      gulp.watch(['dist/**/*.js', 'dist/**/*.css'], integrationTasks);

      $.util.log('Initialise BrowserSync on port 8081');
      browserSync.init({
        files: 'dist/**/*',
        proxy: host,
        port: 8081
      });
    });
});

gulp.task('test-setup', function() {
  var Promise = require('bluebird');

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
  var Promise = require('bluebird');
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

gulp.task('prepublish', function() {
  return runSequence('install', 'build', 'test');
});

gulp.task('default', ['build', 'test']);
