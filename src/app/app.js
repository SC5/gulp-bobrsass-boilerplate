angular.module('SC5AngularBoilerplate', [
    'ngResource',
    'ngRoute',
    'templates'
  ])
  .config(function($routeProvider, $locationProvider) {
    console.log('Hello from config');
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

    $locationProvider.html5Mode(true);
  });
