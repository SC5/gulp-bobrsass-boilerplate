var path = require('path');
var util = require('util');
var gulp = require('gulp');
var bower = require('bower');
var url = require('url');
var _ = require('lodash');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var bowerFiles = require('main-bower-files');
var eventStream = require('event-stream');
var package = require('./package.json');

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
    version: package.version,
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
  return runSequence(['ng-templates', 'javascript', 'stylesheets'], 'integrate', 'test');
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
    .pipe($.cached('jslint'))
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('ng-templates', function() {
  return gulp.src('src/app/**/*.html')
    .pipe($.angularTemplatecache('templates.js', { standalone: true, root: '' }))
    .pipe(gulp.dest('temp'));
});


function getJavascriptConfig() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('bundle-%s.js', config.version);
  var bowerDir = path.join(__dirname, bower.config.directory );

  // Always add ng-templates bundle as shim
  var shims = {
    'templates': {
      path: path.join( __dirname, 'temp', 'templates.js' ),
      exports: 'appTemplates'
    }
  };

  // Add all bower package as shims, with package name and it points
  // to it's main js
  _.each( bowerFiles(), function(file) {
    var relativePath = path.relative(bowerDir, file );
    // Not javascript file
    if( ! /.*.js$/.test(file) )
      return;

    // Use replace to get directory name (package name) from path
    // and if matched to regexp then add it to shims object
    relativePath.replace(/^(.*)\//, function(match, packageName) {
      if( packageName )
        shims[packageName] = {
          path: file,
          // Change dash in package name to camel case format
          exports: packageName.replace(/-(\w)/g, function(all, letter) {
            return letter.toUpperCase();
          } )
        };
    });
  });

  return {
    bundleName: bundleName,
    browserify: {
      transform: [ 'browserify-ngannotate' ],
      shim: shims,
      debug: true
    }
  }
}

gulp.task('javascript', ['preprocess'], function() {
  var jsConfig = getJavascriptConfig();

  return gulp.src('src/app/app.js')
      .pipe($.browserify(jsConfig.browserify))
      .on('error', $.util.log)
      .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.concat(jsConfig.bundleName))
      .pipe($.uglify())
      .pipe($.sourcemaps.write('./'))
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

gulp.task('clean', function(cb) {
  var del = require('del');

  del([
    'dist',
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
  gulp.watch(['src/app/**/*.html'], ['ng-templates']);
  gulp.watch(['src/app/**/*.js', 'temp/templates.js'], function() {
    return runSequence('javascript', 'integrate', 'integrate-test');
  });

  // Watch any changes to the dist directory
  $.util.log('Initialise BrowserSync on port 8081');
  browserSync.init({
    files: 'dist/**/*',
    proxy: 'localhost:8080',
    port: 8081
  });
});

gulp.task('test-setup', function(cb) {
  var cmdAndArgs = package.scripts.start.split(/\s/),
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
          })
      });
      return Promise.resolve();
    });
})

gulp.task('test-run', function() {
  var Promise = require('bluebird');
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

gulp.task('test', function() {
  return runSequence('test-setup', 'test-run', 'test-teardown');
});

gulp.task('default', ['build']);
