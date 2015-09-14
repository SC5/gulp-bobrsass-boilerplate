(function() {
  'use strict';

  var ngModule = angular.module('pages.main', [
    'ui.router'
  ]);

  ngModule.config(function($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/main',
        templateUrl: 'pages/main/main.html',
        controller: 'MainController'
      });
  });
})();
