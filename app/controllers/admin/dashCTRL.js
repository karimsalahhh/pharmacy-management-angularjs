angular.module("pharmacyApp").controller("DashboardController", [
  "$scope",
  "AdminInsightsService",
  function ($scope, AdminInsightsService) {
    $scope.loading = true;
    $scope.error = null;

    $scope.kpis = {
      totalInvoices: 0,
      todayRevenue: 0,
      unfulfilledCount: 0,
      lowStockCount: 0,
    };

    $scope.inventory = {
      totalMedicines: 0,
      availableCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      expiringSoonCount: 0,
      totalStockUnits: 0,
      totalInventoryValue: 0,
      averagePrice: 0,
    };

    $scope.unfulfilledInvoices = [];
    $scope.lowStockMedicines = [];
    $scope.expiringSoonMedicines = [];

    $scope.loadDashboard = function (forceRefresh) {
      $scope.loading = true;
      $scope.error = null;

      AdminInsightsService.getInsights({ forceRefresh: !!forceRefresh })
        .then(function (insights) {
          $scope.inventory = insights.inventory;
          $scope.kpis.totalInvoices = insights.sales.totalInvoices;
          $scope.kpis.todayRevenue = insights.sales.todayRevenue;
          $scope.kpis.unfulfilledCount = insights.sales.unfulfilledCount;
          $scope.kpis.lowStockCount =
            insights.inventory.lowStockCount + insights.inventory.outOfStockCount;

          $scope.unfulfilledInvoices = insights.unfulfilledInvoices.slice(0, 8);
          $scope.lowStockMedicines = insights.inventory.lowStockMedicines.slice(0, 6);
          $scope.expiringSoonMedicines =
            insights.inventory.expiringSoonMedicines.slice(0, 6);
        })
        .catch(function (err) {
          console.error("Failed to load dashboard insights:", err);
          $scope.error = "Could not load dashboard data.";
        })
        .finally(function () {
          $scope.loading = false;
        });
    };

    $scope.loadDashboard();
  },
]);
