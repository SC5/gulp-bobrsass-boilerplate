'use strict';

var gulp = require('gulp');

gulp.task('watch', ['wiredep', 'styles'] ,function () {
  gulp.watch('src/app/styles/**/*.scss', ['styles']);
  gulp.watch('src/app/scripts/**/*.js', ['scripts']);
  gulp.watch('src/app/images/**/*', ['images']);
  gulp.watch('bower.json', ['wiredep']);
});
