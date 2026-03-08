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
      todayInvoices: 0,
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
    $scope.visibleInvoices = [];
    $scope.visibleStockAlerts = [];
    $scope.visibleExpiryAlerts = [];

    $scope.invoiceQueueFilter = "all";
    $scope.alertTab = "stock";
    $scope.alertSearch = "";
    $scope.stockSeverityFilter = "all";

    function normalizeText(v) {
      return (v || "").toString().toLowerCase().trim();
    }

    function toBool(v) {
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1;
      if (typeof v === "string") {
        var s = v.toLowerCase().trim();
        return s === "true" || s === "1" || s === "paid" || s === "yes";
      }
      return false;
    }

    function getTodayStartTime() {
      var now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }

    function applyInvoiceFilter() {
      var filtered = $scope.unfulfilledInvoices;
      if ($scope.invoiceQueueFilter === "paid") {
        filtered = filtered.filter(function (inv) {
          return toBool(inv.paid);
        });
      } else if ($scope.invoiceQueueFilter === "unpaid") {
        filtered = filtered.filter(function (inv) {
          return !toBool(inv.paid);
        });
      }
      $scope.visibleInvoices = filtered;
    }

    function applyAlertFilters() {
      var query = normalizeText($scope.alertSearch);
      $scope.visibleStockAlerts = $scope.lowStockMedicines.filter(function (med) {
        var medName = normalizeText(med.name);
        if (query && medName.indexOf(query) === -1) return false;

        if ($scope.stockSeverityFilter === "critical") return Number(med.stock) === 0;
        if ($scope.stockSeverityFilter === "low") return Number(med.stock) > 0;
        return true;
      });

      $scope.visibleExpiryAlerts = $scope.expiringSoonMedicines.filter(function (med) {
        var medName = normalizeText(med.name);
        return !query || medName.indexOf(query) !== -1;
      });
    }

    $scope.loadDashboard = function (forceRefresh) {
      $scope.loading = true;
      $scope.error = null;

      AdminInsightsService.getInsights({ forceRefresh: !!forceRefresh })
        .then(function (insights) {
          var todayStartTime = getTodayStartTime();
          var todayInvoices = insights.ordersNormalized.filter(function (order) {
            return order.created_time >= todayStartTime;
          }).length;

          $scope.inventory = insights.inventory;
          $scope.kpis.totalInvoices = insights.sales.totalInvoices;
          $scope.kpis.todayRevenue = insights.sales.todayRevenue;
          $scope.kpis.unfulfilledCount = insights.sales.unfulfilledCount;
          $scope.kpis.lowStockCount =
            insights.inventory.lowStockCount + insights.inventory.outOfStockCount;
          $scope.kpis.todayInvoices = todayInvoices;

          $scope.unfulfilledInvoices = insights.unfulfilledInvoices.slice(0, 10);
          $scope.lowStockMedicines = insights.inventory.lowStockMedicines.slice(0, 12);
          $scope.expiringSoonMedicines =
            insights.inventory.expiringSoonMedicines.slice(0, 12);
          applyInvoiceFilter();
          applyAlertFilters();
        })
        .catch(function (err) {
          console.error("Failed to load dashboard insights:", err);
          $scope.error = "Could not load dashboard data.";
        })
        .finally(function () {
          $scope.loading = false;
        });
    };

    $scope.$watch("invoiceQueueFilter", applyInvoiceFilter);
    $scope.$watchCollection("unfulfilledInvoices", applyInvoiceFilter);

    $scope.$watchGroup(
      ["alertSearch", "stockSeverityFilter", "alertTab"],
      applyAlertFilters,
    );
    $scope.$watchCollection("lowStockMedicines", applyAlertFilters);
    $scope.$watchCollection("expiringSoonMedicines", applyAlertFilters);

    $scope.loadDashboard();
  },
]);
