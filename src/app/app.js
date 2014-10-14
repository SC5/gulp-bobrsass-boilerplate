var angular = require('angular');
require('angular-route');
require('angular-resource');

// Created by gulp build from *.html files
require('templates');

var app = angular.module('SC5AngularBoilerplate', [
    'ngResource',
    'ngRoute',
    'templates'
  ])
  .config(function($routeProvider, $locationProvider) {
    console.log('Hello from config');
    $routeProvider.
      when('/', {
          templateUrl: 'pages/main/view.html',
          controller: require('./pages/main/controller')
      }).
      when('/sample', {
          templateUrl: 'pages/sample/view.html',
          controller: require('./pages/sample/controller')
      }).
      otherwise({
          redirectTo: '/'
      });

      $locationProvider.html5Mode(true);
  });

module.exports = app;
