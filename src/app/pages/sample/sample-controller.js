(function() {
  'use strict';

  angular.module('pages.sample')
    .controller('SampleController', function(SampleService) {
      this.valueFromService = SampleService.value;
    });
})();
