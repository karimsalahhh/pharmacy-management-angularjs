angular.module("pharmacyApp").controller("StatisticsController", [
  "$scope",
  "MedsService",
  function ($scope, MedsService) {
    $scope.stats = {};

    // TODO: Implement statistics logic
    $scope.loadStats = function () {
      // Placeholder
      $scope.stats = {
        totalMedicines: 0,
        totalValue: 0,
        // etc.
      };
    };

    $scope.loadStats();
  },
]);
