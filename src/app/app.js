'use strict';

angular.module('SC5AngularBoilerplate', [
    'ui.router',
    'templates'
  ])
  .config(function($stateProvider, $urlRouterProvider, $locationProvider) {
    console.log('Hello from config');
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/main');

    $stateProvider
      .state('main', {
        url: '/main',
        templateUrl: 'main/main.html'
      })
      .state('sample', {
        url: '/sample',
        templateUrl: 'sample/sample.html'
      });
  });
