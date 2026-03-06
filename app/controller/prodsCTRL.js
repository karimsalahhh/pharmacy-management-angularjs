angular.module("pharmacyApp").controller("prodsCTRL", [
  "$scope",
  "MedsService",
  function ($scope, MedsService) {
    $scope.products = [];
    $scope.filteredProducts = [];
    $scope.loading = true;
    $scope.errorMessage = "";

    $scope.searchText = "";
    $scope.stockFilter = "all";

    $scope.loadProducts = function () {
      $scope.loading = true;
      $scope.errorMessage = "";

      MedsService.getAll()
        .then(function (response) {
          $scope.products = response.data || [];
          $scope.filteredProducts = angular.copy($scope.products);
          $scope.loading = false;
        })
        .catch(function (error) {
          $scope.loading = false;
          $scope.errorMessage = "Failed to load products.";
          console.error("Products error:", error);
        });
    };

    $scope.getStockStatus = function (stock) {
      stock = Number(stock) || 0;

      if (stock === 0) return "out";
      if (stock <= 10) return "low";
      return "available";
    };

    $scope.filterProducts = function () {
      var text = ($scope.searchText || "").toLowerCase().trim();
      var stockFilter = $scope.stockFilter;

      $scope.filteredProducts = $scope.products.filter(function (item) {
        var matchesName = item.name.toLowerCase().includes(text);
        var status = $scope.getStockStatus(item.stock);

        var matchesStock =
          stockFilter === "all" ? true : status === stockFilter;

        return matchesName && matchesStock;
      });
    };

    $scope.loadProducts();
  },
]);
