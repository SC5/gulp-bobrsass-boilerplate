angular.module('SC5AngularBoilerplate', [
    'ngResource',
    'ngRoute',
    'templates'
  ])
  .config(function($routeProvider, $locationProvider) {
    console.log('Hello from config');
    $routeProvider.
      when('/', {
          templateUrl: 'assets/views/main.html'
      }).
      when('/sample', {
          templateUrl: 'assets/views/sample.html',
          controller: 'SampleController'
      }).
      otherwise({
          redirectTo: '/'
      });

      $locationProvider.html5Mode(true);
  });
