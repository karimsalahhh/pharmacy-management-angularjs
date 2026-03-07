angular.module("pharmacyApp").controller("StatisticsController", [
  "$scope",
  "AdminInsightsService",
  function ($scope, AdminInsightsService) {
    $scope.loading = true;
    $scope.error = null;
    $scope.periodDays = 30;
    $scope.lastUpdated = null;

    $scope.summary = {
      invoices: 0,
      revenue: 0,
      avgInvoice: 0,
      paidRate: 0,
      fulfillmentRate: 0,
      unfulfilledCount: 0,
    };

    $scope.topMedicines = [];
    $scope.topCustomers = [];
    $scope.revenueTrend = [];
    $scope.inventorySnapshot = {};
    $scope.allOrders = [];

    function toNumber(v) {
      var n = Number(v);
      return isNaN(n) ? 0 : n;
    }

    function periodStartMs(days) {
      var now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (toNumber(days) - 1),
      ).getTime();
    }

    function applyPeriodMetrics() {
      var start = periodStartMs($scope.periodDays);
      var inPeriod = $scope.allOrders.filter(function (o) {
        return o.created_time >= start;
      });

      var invoices = inPeriod.length;
      var revenue = 0;
      var paidCount = 0;
      var fulfilledCount = 0;
      var unfulfilledCount = 0;

      for (var i = 0; i < inPeriod.length; i++) {
        var order = inPeriod[i];
        revenue += toNumber(order.total);
        if (order.paid) paidCount++;
        if (order.fulfilled) fulfilledCount++;
        else unfulfilledCount++;
      }

      $scope.summary.invoices = invoices;
      $scope.summary.revenue = revenue;
      $scope.summary.avgInvoice = invoices > 0 ? revenue / invoices : 0;
      $scope.summary.paidRate =
        invoices > 0 ? (paidCount / invoices) * 100 : 0;
      $scope.summary.fulfillmentRate =
        invoices > 0 ? (fulfilledCount / invoices) * 100 : 0;
      $scope.summary.unfulfilledCount = unfulfilledCount;
    }

    function buildTrend(series) {
      var start = periodStartMs($scope.periodDays);
      var filtered = series.filter(function (p) {
        return new Date(p.day).getTime() >= start;
      });
      var max = 0;
      for (var i = 0; i < filtered.length; i++) {
        if (filtered[i].value > max) max = filtered[i].value;
      }
      $scope.revenueTrend = filtered.map(function (p) {
        return {
          day: p.day,
          value: p.value,
          width: max > 0 ? (p.value / max) * 100 : 0,
        };
      });
    }

    $scope.changePeriod = function () {
      applyPeriodMetrics();
      if ($scope._cachedSeries) buildTrend($scope._cachedSeries);
    };

    $scope.loadStats = function (forceRefresh) {
      $scope.loading = true;
      $scope.error = null;

      AdminInsightsService.getInsights({ forceRefresh: !!forceRefresh })
        .then(function (insights) {
          $scope.inventorySnapshot = insights.inventory;
          $scope.topMedicines = insights.topMedicines;
          $scope.topCustomers = insights.topCustomers;
          $scope.allOrders = insights.ordersNormalized;
          $scope._cachedSeries = insights.revenueSeries;
          $scope.lastUpdated = new Date();

          applyPeriodMetrics();
          buildTrend(insights.revenueSeries);
        })
        .catch(function (err) {
          console.error("Failed loading statistics:", err);
          $scope.error = "Could not load statistics.";
        })
        .finally(function () {
          $scope.loading = false;
        });
    };

    $scope.loadStats();
  },
]);
