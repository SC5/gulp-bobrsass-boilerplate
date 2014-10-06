'use strict';

var gulp = require('gulp');

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('src/app/styles/*.scss')
    .pipe(wiredep({
        directory: 'src/app/bower_components'
    }))
    .pipe(gulp.dest('src/app/styles'));

  gulp.src('src/app/*.html')
    .pipe(wiredep({
      directory: 'src/app/bower_components',
      exclude: ['foundation']
    }))
    .pipe(gulp.dest('src/app'));
});
