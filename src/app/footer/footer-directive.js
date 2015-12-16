(function() {
  'use strict';

  angular.module('app.footer')
    .directive('appFooter', function() {
      return {
        restrict: 'A',
        templateUrl: 'footer/footer.html'
      };
    });
})();
