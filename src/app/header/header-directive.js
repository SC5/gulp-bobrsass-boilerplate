(function() {
  'use strict';

  angular.module('app.header', [])
    .directive('appHeader', function() {
      return {
        restrict: 'A',
        templateUrl: 'header/header.html'
      };
    });
})();
