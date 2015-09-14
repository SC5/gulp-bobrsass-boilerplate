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
  });

  // Initialize application to document (whole page)
  angular.element(document).ready(function() {
    angular.bootstrap(document, ['SC5AngularBoilerplate']);
  });
})();
