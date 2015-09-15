(function() {
  'use strict';

  angular.module('pages.sample')
    .factory('SampleService', function() {
      return {
        value: 'Hello from service'
      };
    });
})();
