
angular.module('SC5AngularBoilerplate', ['ngAnimate', 'ui.router'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('main', {
      controller: 'MainController',
      url: '/',
      templateUrl: 'templates/main.html'
    })
    .state('sample', {
      controller: 'SampleController',
      url: '/sample',
      templateUrl: 'templates/sample.html'
    });

    $urlRouterProvider.otherwise('/');
  })
;
