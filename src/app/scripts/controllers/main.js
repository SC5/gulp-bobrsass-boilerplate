angular.module('SC5AngularBoilerplate')
  .controller('MainController', function($scope, $log) {
    $log.debug('MainController');
    $scope.date = new Date().toString();
  });
