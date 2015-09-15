(function() {
  'use strict';

  var ngModule = angular.module('SC5AngularBoilerplate', [
    'ui.router',
    'templates',
    'app.header',
    'app.footer',
    'app.pages'
  ]);

  ngModule.config(function($urlRouterProvider, $locationProvider) {
    console.log('Hello from config');

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/main');

    // Optional trailing slash rule
    $urlRouterProvider.rule(function($injector, $location) {
      var path = $location.url();

      // check to see if the path already has a slash where it should be
      if (path[path.length - 1] === '/' || path.indexOf('/?') > -1) {
        return;
      }

      if (path.indexOf('?') > -1) {
        return path.replace('?', '/?');
      }

      return path + '/';
    });
  });

  // Initialize application to document (whole page)
  angular.element(document).ready(function() {
    angular.bootstrap(document, ['SC5AngularBoilerplate']);
  });
})();
