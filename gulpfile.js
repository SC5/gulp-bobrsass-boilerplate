var path = require('path'),
    util = require('util'),
    gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    package = require('./package.json');

/* Configurations. Note that most of the configuration is stored in
the task context. These are mainly for repeating configuration items */
var config = {
  version: package.version,
  debug: Boolean($.util.env.debug),
};

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

// Cleanup
gulp.task('clean', function() {
  gulp.src('dist', { read: false })
    .pipe($.clean());
});

/* Serve the web site */
gulp.task('serve', $.serve({
  root: 'dist',
  port: 8080
}));

gulp.task('javascript', ['jslint'], function() {
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
    .pipe($.plumber())
    .pipe($.browserify(browserifyConfig))
    .pipe($.concat(bundleName))
    .pipe($.if(config.debug, $.uglify()))
    // Integration test
    .pipe(gulp.dest('dist'));
});

gulp.task('stylesheets', ['csslint'], function() {
  // The non-MD5fied prefix, so that we know which version we are actually
  // referring to in case of fixing bugs
  var bundleName = util.format('styles-%s.css', config.version);
  
  return gulp.src('src/css/styles.scss')
    .pipe($.plumber())
    // Compile
    .pipe($.compass({
        project: path.join(__dirname, 'src'),
        sass: 'css',
        css: '../temp/css'
    }))
    // Unit test
    // Integrate (link, package, concatenate)
    .pipe($.concat(bundleName))
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
    .pipe($.clean());
});

gulp.task('integrate', ['javascript', 'stylesheets', 'assets'], function() {
  return gulp.src(['dist/*.js', 'dist/css/*.css'])
    .pipe($.inject('src/index.html', { ignorePath: ['/dist/'], addRootSlash: false }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', ['integrate', 'test'], function() {
  var server = $.livereload();
  
  // Watch the actual resources; Currently trigger a full rebuild
  gulp.watch([
    'src/css/**/*.scss', 
    'src/css/**/*.css',
    'src/app/**/*.js', 
    'src/app/**/*.hbs', 
    'src/*.html'
  ], ['integrate']);
  
  // Only livereload if the HTML (or other static assets) are changed, because
  // the HTML will change for any JS or CSS change
  gulp.src('dist/**', { read: false })
    .pipe($.watch())
    .pipe($.livereload());
});

gulp.task('jslint', function() {
  return gulp.src('src/app/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter());
});

gulp.task('csslint', function() {
  return gulp.src('src/css/**/*.css')
    .pipe($.csslint())
    .pipe($.csslint.reporter());
});

gulp.task('webdriver', function(cb) {

  if (config.debug) {
    cb();
  } else {

    var phantom = require('phantomjs-server'),
        webdriver = require('selenium-webdriver');
 
    // Start PhantomJS
    phantom.start().done(function() {
      var driver = new webdriver.Builder()
        .usingServer(phantom.address())
        .build();
      cb();
    });

  }

});

gulp.task('test', ['webdriver'], function() {

  if (config.debug) {
    // Find the selenium server standalone jar file, version number in the filename
    // is due to change
    var find = require('find'),
        paths = find.fileSync(/selenium-server-standalone.*\.jar/, 'node_modules/protractor/selenium'),
        args = ['--seleniumServerJar', paths[0]];
  } else {
    var args = ['--seleniumAddress', 'http://localhost:4444/'];
  }

  // Run tests
  gulp.src(['tests/*.js'])
    .pipe($.protractor.protractor({
      configFile: 'protractor.config.js',
      args: args
    }))    
    .on('error', function(e) { throw e; });

});

gulp.task('default', ['integrate', 'test']);
