'use strict';

angular.module('SC5AngularBoilerplate', [
    'ngResource',
    'ngRoute',
    'templates'
  ])
  .config(function($routeProvider, $locationProvider) {
    console.log('Hello from config');

    $locationProvider.html5Mode(true);
    $routeProvider.
      when('/', {
        templateUrl: 'main/main.html'
      }).
      when('/sample', {
        templateUrl: 'sample/sample.html',
        controller: 'SampleController'
      }).
      otherwise({
        redirectTo: '/'
      });
  });
