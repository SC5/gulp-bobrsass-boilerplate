var path = require('path'),
    util = require('util'),
    gulp = require('gulp'),
    url = require('url'),
    $ = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    bowerFiles = require('main-bower-files'),
    Promise = require('bluebird'),
    exec = require('exec-wait'),
    eventStream = require('event-stream'),
    package = require('./package.json');

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
    version: package.version,
    debug: Boolean($.util.env.debug)
  },
  ghostDriver = exec({
    name: 'Ghostdriver',
    cmd: path.join(require.resolve('phantomjs'), '../phantom',
       (process.platform === 'win32' ? '' : 'bin'),
      'phantomjs' + (process.platform === 'win32' ? '.exe' : '')),
    args: ['--webdriver=4444', '--ignore-ssl-errors=true'],
    monitor: { stdout: 'GhostDriver - Main - running on port 4444' },
    log: $.util.log
  }),
  cmdAndArgs = package.scripts.start.split(/\s/),
  testServer = exec({
    name: 'Test server',
    cmd: cmdAndArgs[0] + (process.platform === 'win32' ? '.cmd' : ''),
    args: cmdAndArgs.slice(1),
    monitor: { url: 'http://localhost:8080/', checkHTTPResponse: false },
    log: $.util.log,
    stopSignal: 'SIGTERM'
  });

// Package management
/* Install & update Bower dependencies */
gulp.task('install', function() {
  // FIXME specifying the component directory broken in gulp
  // For now, use .bowerrc; No need for piping, either
  $.bower();
  // Downloads the Selenium webdriver
  $.protractor.webdriver_update(function() {});
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

/* Serve the web site */
gulp.task('serve', $.serve({
  root: 'dist',
  port: 8080,
  middleware: function(req, res, next) {
    var u = url.parse(req.url);

  	// Rewrite urls of form 'main' & 'sample' to blank
    var rule = /^\/(main|sample)/;

  	if (u.pathname.match(rule)) {
  		u.pathname = u.pathname.replace(rule, '');
  		var original = req.url;
  		req.url = url.format(u);
  		console.log('Rewrote', original, 'to', req.url);
  	}

    next();
  }
}));

gulp.task('preprocess', function() {
  return gulp.src('src/app/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('javascript', ['preprocess'], function() {

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
    .pipe($.plumber())
    .pipe($.concat('components.js'));

  var app = gulp.src('src/app/**/*.js')
    .pipe($.concat('app.js'));

  return eventStream.merge(components, app)
    .pipe($.order([
      '**/components.js',
      '**/app.js'
    ]))
    .pipe($.concat(bundleName))
    .pipe($.if(!config.debug, $.ngmin()))
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
    .pipe($.if(!config.debug,$.csso()))
    .pipe(gulp.dest('dist/css'))
    .pipe($.csslint())
    .pipe($.csslint.reporter());
}); 

gulp.task('assets', function() {
  return gulp.src('src/assets/**')
    .pipe(gulp.dest('dist/assets'));
    // Integration test
});

gulp.task('clean', function() {
  return gulp.src(['dist', 'temp'], { read: false })
    .pipe($.rimraf());
});

gulp.task('integrate', ['javascript', 'stylesheets', 'assets'], function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
    .pipe($.inject('src/index.html', { ignorePath: ['/dist/'], addRootSlash: false }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('integrate-test', function() {
  console.log('integrate-test');
  return runSequence(['integrate'], 'test-run');
});

gulp.task('watch', ['integrate', 'test-setup'], function() {
  var server = $.livereload();

  var stream = gulp.watch([
    'src/css/**/*.scss',
    'src/app/**/*.js',
    'src/assets/**/*.html',
    'src/*.html'
  ], ['integrate-test']);

  // Only livereload if the HTML (or other static assets) are changed, because
  // the HTML will change for any JS or CSS change
  gulp.src('dist/**', { read: false })
    .pipe($.watch())
    .pipe($.livereload());

  return stream;
});

gulp.task('test-setup', function(cb) {

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
          })
      });
      return Promise.resolve();
    });
})

gulp.task('test-run', function() {
  $.util.log('Running protractor');

  return new Promise(function(resolve, reject) {
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
    })
  });
});

gulp.task('test-teardown', function() {
  return ghostDriver.stop()
    .then(testServer.stop);
})

gulp.task('default', function() {
  return runSequence(['integrate', 'test-setup'], 'test-run', 'test-teardown');
});
