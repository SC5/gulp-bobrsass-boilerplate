(function() {
  'use strict';

  var ngModule = angular.module('pages.sample', [
    'ui.router'
  ]);

  ngModule.config(function($stateProvider) {
    $stateProvider
      .state('sample', {
        url: '/sample',
        templateUrl: 'pages/sample/sample.html',
        controller: 'SampleController'
      });
  });
})();
