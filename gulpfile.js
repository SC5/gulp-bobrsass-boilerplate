/* jshint -W024 */ /* Disable reserved word check for $.if */

'use strict';

var $ = require('gulp-load-plugins')();
var bowerFiles = require('main-bower-files');
var browserSync = require('browser-sync');
var del = require('del');
var eventStream = require('event-stream');
var exec = require('exec-wait');
var gulp = require('gulp');
var path = require('path');
var pkg = require('./package.json');
var Promise = require('bluebird');
var awspublish = require('gulp-awspublish');
var runSequence = require('run-sequence');
var util = require('util');

/*
Configuration.
Note that most of the configuration is stored in the task context.
These are mainly for repeating configuration items.
*/

// App config
var config = {
  version: pkg.version,
  port: process.env.PORT || pkg.config.port,
  hostname: process.env.HOSTNAME || pkg.config.hostname,
  debug: Boolean($.util.env.debug) || (process.env.NODE_ENV === 'development'),
  production: Boolean($.util.env.production) || (process.env.NODE_ENV === 'production'),
  bucket: pkg.config.bucket,
  protocol: (pkg.config.https === true) ? 'https' : 'http'
};

// Test server URL (shared with server.js)
var url = [config.protocol + '://', config.hostname + ':' + config.port, '/'].join('');

// Global vars used across the test tasks
var testServerCmdAndArgs = pkg.scripts.start.split(/\s/);
var phantomPath = path.dirname(require.resolve('phantomjs'));
var phantomCmd = path.resolve(phantomPath, require(path.join(phantomPath, 'location')).location);
var ghostDriver = exec({
  name: 'Ghostdriver',
  cmd: phantomCmd,
  args: ['--webdriver=4444', '--ignore-ssl-errors=true'],
  monitor: { stdout: 'GhostDriver - Main - running on port 4444' },
  log: $.util.log
});
var testServer = exec({
  name: 'Test server',
  cmd: testServerCmdAndArgs[0] + (process.platform === 'win32' ? '.cmd' : ''),
  args: testServerCmdAndArgs.slice(1),
  monitor: {
    url: url,
    checkHTTPResponse: false
  },
  log: $.util.log,
  stopSignal: 'SIGTERM',
  httpOptions: {
    rejectUnauthorized: false
  }
});

// The last test run result
var lastTestRunPassed = true;

// Options for gulp-changed to track file changes
var changeOptions = { hasChanged: $.changed.compareSha1Digest };

/*
Package management.
*/

/* Install & update Bower dependencies */
gulp.task('install', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  return $.bower();
});

gulp.task('clean', function(cb) {
  return del([
    'dist',
    'temp'
  ], cb);
});

/* Bump version number for package.json & bower.json. */
gulp.task('bump', function() {
  // TODO Provide means for appending a patch id based on git commit id or md5 hash
  // Fetch whether we're bumping major, minor or patch; default to minor
  var env = $.util.env;
  var type = (env.major) ? 'major' : (env.patch) ? 'patch' : 'minor';

  return gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({ type: type }))
    .pipe(gulp.dest('./'));
});

/* JSCS linting */
gulp.task('jscs', function() {
  return gulp.src(['*.js', 'src/app/**/*.js', 'tests/**/*.js'])
    .pipe($.plumber())
    .pipe($.jscs('.jscsrc'));
});

/* JSHint style checking */
gulp.task('jshint', function() {
  return gulp.src(['*.js', 'src/app/**/*.js', 'tests/**/*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

/* Process javascript */
gulp.task('javascript', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
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

/* Process stylesheets */
gulp.task('stylesheets', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('styles-%s.css', config.version);

  // Pick all the 3rd party CSS and SASS, concat them into 3rd party
  // components bundle. Then append them to our own sources, and
  // throw them all through Compass
  var components = gulp.src(bowerFiles())
    .pipe($.filter(['**/*.css']))
    .pipe($.concat('components.css'));

  /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
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
  /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

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

/* Copy assets */
gulp.task('assets', function() {
  // Due to file name match, using time delta with gulp-changed is alright
  return gulp.src('src/assets/**')
    .pipe($.changed('dist', changeOptions))
    .pipe(gulp.dest('dist/assets'));
});

/* Integration test */
gulp.task('integrate', function() {
  var target = gulp.src('src/index.html');
  var source = gulp.src(['dist/*.js', 'dist/styles/*.css'], { read: false });
  var params = { ignorePath: ['/dist/'], addRootSlash: false };

  // Check whether to run tests as part of integration
  return target
    .pipe($.inject(source, params))
    .pipe($.changed('dist'), changeOptions)
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['build'], function() {
  var testOnWatch = typeof $.util.env.test !== 'undefined';
  var lintOnWatch = typeof $.util.env.nolint === 'undefined';

  // Watch needs a test server to run; start that.
  return testServer.start()
    .then(function() {
      if (testOnWatch) {
        return ghostDriver.start();
      }
    })
    .then(function() {
      var integrationTasks = ['integrate'].concat((testOnWatch) ? ['test-run'] : []);
      var jsTasks = (lintOnWatch ? ['jshint', 'jscs'] : []).concat(['javascript']);

      // Compose several watch streams, each resulting in their own pipe
      gulp.watch('src/app/**/*.scss', ['stylesheets']);
      gulp.watch(['src/app/**/*.js', 'src/app/**/*.html'], jsTasks);
      gulp.watch(['src/assets/**'], ['assets']);
      gulp.watch(['src/index.html'], ['integrate']);

      // Watch any changes to the dist directory
      gulp.watch(['dist/**/*.js', 'dist/**/*.css'], integrationTasks);

      $.util.log('Initialise BrowserSync on port 8081');

      var options = {
        files: 'dist/**/*',
        proxy: {
          target: config.protocol + '://' + config.hostname + ':' + config.port
        },
        port: 8081
      };
      if (config.protocol === 'https') {
        options.https = {
          key: 'server/key.pem',
          cert: 'server/cert.pem'
        };
      }
      browserSync.init(options);
    });
});

gulp.task('deploy', function() {
  if (! config.bucket) {
    $.util.log('ERROR: Bucket not defined')
    return;
  }
  $.util.log('Upload to bucket ' + config.bucket);
  var publisher = awspublish.create({
    params: {
      Bucket: config.bucket
    }
  });
  var headers = {};

  return gulp.src('dist/*')
    .pipe(publisher.publish(headers))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter());
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
  lastTestRunPassed = true;

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
      // Keep the last test run result to be able to exit with proper
      // non-zero return code after setup-run-teardown-sequence has
      // completed.
      lastTestRunPassed = false;
      resolve();
    });
  });
});

gulp.task('test-teardown', function() {
  return ghostDriver.stop()
    .then(testServer.stop);
});

// Sole purpose of this task is to exit with non-zero return code if
// last test-run did not pass.
gulp.task('test-retcode', function() {
  return new Promise(function(resolve) {
    if (!lastTestRunPassed) {
      process.exit(1);
    }

    resolve();
  });
});

gulp.task('test', function(done) {
  return runSequence('test-setup', 'test-run', 'test-teardown', 'test-retcode', done);
});

// Task combinations
gulp.task('build', function() {
  return runSequence(['javascript', 'stylesheets', 'assets'], 'integrate');
});

gulp.task('default', ['build', 'test']);
