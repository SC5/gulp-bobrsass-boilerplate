/* jshint -W024 */ /* Disable reserved word check for $.if */

'use strict';

var fs = require('fs');
var $ = require('gulp-load-plugins')();
var bowerFiles = require('main-bower-files');
var browserSync = require('browser-sync');
var del = require('del');
var eventStream = require('event-stream');
var exec = require('exec-wait');
var gulp = require('gulp');
var path = require('path');
var pkg = require('./package.json');
var awspublish = require('gulp-awspublish');
var runSequence = require('run-sequence');
var util = require('util');
var karma = require('karma');

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
  bucket: pkg.config.bucket
};

// Test server URL (shared with server.js)
var url = ['http://', config.hostname + ':' + config.port, '/'].join('');

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
  stopSignal: 'SIGTERM'
});

// The last test run result
var lastTestRunPassed = true;
var lastUnitTestRunPassed = true;

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
  return gulp.src(['*.js', 'src/app/**/*.js'])
    .pipe($.plumber())
    .pipe($.jscs('.jscsrc'));
});

/* JSHint style checking */
gulp.task('jshint', function() {
  return gulp.src(['*.js', 'src/app/**/*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

/* Process javascript */
gulp.task('javascript', [
  'javascript-app',
  'javascript-components'
]);

function javascriptTransform(inputStream, bundleName) {
  return inputStream
    .pipe($.sourcemaps.init())
    .pipe($.concat(bundleName))
    .pipe($.if(!config.debug, $.ngAnnotate()))
    .pipe($.if(!config.debug, $.uglify()))
    .pipe($.sourcemaps.write());
}

function getFolders(dir) {
  return fs.readdirSync(dir).filter(function(file) {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

function bundleFolders(dir) {
  var bundleName = 'module.js';

  var folders = getFolders(dir);
  var subModules = folders.map(function(folder) {
    return bundleFolders(path.join(dir, folder), dir);
  });

  var files = gulp.src([path.join(dir, '*.js'), '!**/*.test.js', '!**/*.spec.js'])
    .pipe($.order([
      '*module*.js',
      '*.js'
    ]));

  var moduleStream = javascriptTransform(files, bundleName);
  subModules.push(moduleStream);

  return javascriptTransform($.merge.apply($.merge, subModules), bundleName);
}

gulp.task('javascript-app', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('bundle-%s.js', config.version);

  var templates = gulp.src(['src/app/**/*.html', '!src/index.html'])
      .pipe($.angularTemplatecache('templates.js', { standalone: true }));

  var app = bundleFolders('src/app');

  // TODO: Make sure that templates is first in bundle
  var bundleStream = eventStream.merge(templates, app);

  return javascriptTransform(bundleStream, bundleName).pipe($.changed('dist', changeOptions))
    .pipe(gulp.dest('dist'));
});

gulp.task('javascript-components', function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('components-%s.js', config.version);

  return gulp.src(bowerFiles())
      .pipe($.filter('**/*.js'))
      .pipe($.plumber())
      .pipe($.order([
        'components/**/jquery*.js',
        'components/angular/angular.js',
        'components/**/*.js'
      ], { base: path.join(__dirname, 'src') }))
      .pipe($.concat(bundleName))
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
    .pipe($.sass().on('error', $.sass.logError))
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
      $.sourcemaps.write({ sourceRoot: path.join(__dirname, 'src/app') }))
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
  var source = gulp.src(['dist/*.js', 'dist/styles/*.css'], { read: false })
      .pipe($.order([
        '**/components-*.js',
        '**/*.js'
      ]));
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
      var jsTasks = (lintOnWatch ? ['jshint', 'jscs'] : []).concat(['javascript-app']);

      // Compose several watch streams, each resulting in their own pipe
      gulp.watch('src/app/**/*.scss', ['stylesheets']);
      gulp.watch(['src/app/**/*.js', 'src/app/**/*.html'], jsTasks);
      gulp.watch(['src/components/**/*.js'], ['javascript-components']);
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
    });
});

gulp.task('test-run-protractor', function(done) {
  $.util.log('Running protractor');
  lastTestRunPassed = true;

  gulp.src(['src/app/**/*.test.js'])
    .pipe($.plumber())
    .pipe($.protractor.protractor({
      configFile: 'protractor.config.js',
      args: ['--seleniumAddress', 'http://localhost:4444/wd/hub',
             '--baseUrl', url]
    }))
    .on('end', function() {
      done();
    })
    .on('error', function() {
      // Keep the last test run result to be able to exit with proper
      // non-zero return code after setup-run-teardown-sequence has
      // completed.
      lastTestRunPassed = false;
      done();
    });
});

gulp.task('test-teardown', function() {
  return ghostDriver.stop()
    .then(testServer.stop);
});

// Sole purpose of this task is to exit with non-zero return code if
// last test-run did not pass.
gulp.task('test-retcode', function(done) {
  if (!lastTestRunPassed || !lastUnitTestRunPassed) {
    process.exit(1);
  }

  done();
});

gulp.task('test-protractor', function(done) {
  return runSequence('test-setup', 'test-run-protractor', 'test-teardown', done);
});

gulp.task('test-run-karma', function(done) {
  $.util.log('Running karma');

  lastUnitTestRunPassed = true;
  karma.server.start({
    configFile: path.join(__dirname, 'karma.conf.js'),
    singleRun: true
  }, function(errorCode) {
    lastUnitTestRunPassed = !errorCode;
    done();
  });
});

gulp.task('test-run', ['test-run-protractor', 'test-run-karma']);

gulp.task('test', function() {
  runSequence('test-run-karma', 'test-protractor', 'test-retcode');
});

// Task combinations
gulp.task('build', function() {
  return runSequence(['javascript', 'stylesheets', 'assets'], 'integrate');
});

gulp.task('default', ['build', 'test']);
