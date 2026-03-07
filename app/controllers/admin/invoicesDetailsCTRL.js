angular.module("pharmacyApp").controller("InvoicesDetailsController", [
  "$scope",
  "$location",
  "OrdersService",
  "CustomersService",
  function ($scope, $location, OrdersService, CustomersService) {
    // read customer context from query string
    // ex: /admin/invoicesDetails?customerId=1
    $scope.customerId = $location.search().customerId || null;

    $scope.customer = null; // { id, name, phone, email }
    $scope.invoices = []; // invoices for this customer
    $scope.invoiceItems = []; // all items (filtered in view)
    $scope.loading = true;
    $scope.error = null;

    function toNumber(v) {
      var n = Number(v);
      return isNaN(n) ? 0 : n;
    }

    function groupItemsByInvoice(items) {
      var map = {};
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var invId = it.invoice_id;
        if (!map[invId]) map[invId] = [];
        map[invId].push(it);
      }
      return map;
    }

    function loadAll() {
      $scope.loading = true;
      $scope.error = null;

      if (!$scope.customerId) {
        $scope.loading = false;
        $scope.error = "No customer selected.";
        return;
      }

      // 1) Load customer row (we don't have getById, so use getAll and find)
      CustomersService.getAll()
        .then(function (cres) {
          var list = cres.data || [];
          var idNum = toNumber($scope.customerId);

          for (var i = 0; i < list.length; i++) {
            if (toNumber(list[i].id) === idNum) {
              $scope.customer = list[i];
              break;
            }
          }

          // 2) Load invoices + items
          return Promise.all
            ? Promise.all([
                OrdersService.getAllOrders(),
                OrdersService.getAllItems(),
              ])
            : null;
        })
        .catch(function () {
          // Fallback for environments without Promise (use $q-style chaining)
          return OrdersService.getAllOrders().then(function (ores) {
            return OrdersService.getAllItems().then(function (ires) {
              return { __paired: true, orders: ores, items: ires };
            });
          });
        })
        .then(function (res) {
          // If Promise.all path
          if (res && res.__paired) {
            return res;
          }
          if (res && res.length === 2) {
            return { __paired: true, orders: res[0], items: res[1] };
          }
          // If we got here, something is off but don't crash
          return res;
        })
        .then(function (paired) {
          if (!paired || !paired.__paired) {
            throw new Error("Failed to load invoices data");
          }

          var orders = (paired.orders && paired.orders.data) || [];
          var items = (paired.items && paired.items.data) || [];

          var idNum = toNumber($scope.customerId);

          // filter invoices by customer
          var inv = [];
          for (var i = 0; i < orders.length; i++) {
            if (toNumber(orders[i].customer_id) === idNum) inv.push(orders[i]);
          }

          // newest first (bigger id first)
          inv.sort(function (a, b) {
            return toNumber(b.id) - toNumber(a.id);
          });

          $scope.invoices = inv;
          $scope.invoiceItems = items;

          // build helper map: invoice_id -> items[]
          $scope.itemsByInvoice = groupItemsByInvoice(items);

          $scope.loading = false;
        })
        .catch(function (err) {
          console.error("Load invoices details failed:", err);
          $scope.loading = false;
          $scope.error = "Failed to load invoices details.";
        });
    }

    loadAll();
  },
]);
