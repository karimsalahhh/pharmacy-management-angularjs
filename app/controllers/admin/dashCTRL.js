console.log("DashboardController file loaded");

// !This file controls the dashboard view and its calling of the data from medsService.js
angular.module("pharmacyApp").controller("DashboardController", [
  "$scope",
  "MedsService",
  function ($scope, MedsService) {
    $scope.medicines = [];
    $scope.totalMedicines = 0;
    $scope.lowStockCount = 0;
    $scope.outOfStockCount = 0;
    $scope.averagePrice = 0;
    $scope.expiringSoonCount = 0;

    // New dashboard values
    $scope.availableCount = 0;
    $scope.totalStockUnits = 0;
    $scope.totalInventoryValue = 0;
    $scope.lowStockMedicines = [];
    $scope.expiringSoonMedicines = [];

    MedsService.getAll()
      .then(function (response) {
        $scope.medicines = response.data || [];
        $scope.totalMedicines = $scope.medicines.length;

        var lowStock = 0;
        var outOfStock = 0;
        var totalPrice = 0;
        var expiringSoon = 0;

        var available = 0;
        var totalStock = 0;
        var totalValue = 0;

        var today = new Date();
        var next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        $scope.lowStockMedicines = [];
        $scope.expiringSoonMedicines = [];

        angular.forEach($scope.medicines, function (med) {
          var stock = Number(med.stock) || 0;
          var price = Number(med.price) || 0;
          var expiryDate = med.expiry_date ? new Date(med.expiry_date) : null;

          totalPrice += price;
          totalStock += stock;
          totalValue += stock * price;

          if (stock === 0) {
            outOfStock++;
            $scope.lowStockMedicines.push(med);
          } else if (stock <= 10) {
            lowStock++;
            $scope.lowStockMedicines.push(med);
          } else {
            available++;
          }

          if (expiryDate && expiryDate >= today && expiryDate <= next30Days) {
            expiringSoon++;
            $scope.expiringSoonMedicines.push(med);
          }
        });

        $scope.lowStockCount = lowStock;
        $scope.outOfStockCount = outOfStock;
        $scope.averagePrice =
          $scope.totalMedicines > 0 ? totalPrice / $scope.totalMedicines : 0;
        $scope.expiringSoonCount = expiringSoon;

        $scope.availableCount = available;
        $scope.totalStockUnits = totalStock;
        $scope.totalInventoryValue = totalValue;

        // limit alert lists on dashboard
        $scope.lowStockMedicines = $scope.lowStockMedicines.slice(0, 5);
        $scope.expiringSoonMedicines = $scope.expiringSoonMedicines.slice(0, 5);
      })
      .catch(function (error) {
        console.error("Error fetching dashboard data:", error);
      });
  },
]);
