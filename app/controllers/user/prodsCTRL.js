angular.module("pharmacyApp").controller("ProductsController", [
  "$scope",
  "MedsService",
  function ($scope, MedsService) {
    $scope.products = [];

    $scope.loadProducts = function () {
      MedsService.getAll().then(function (response) {
        $scope.products = response.data || [];
      });
    };

    $scope.loadProducts();
  },
]);
