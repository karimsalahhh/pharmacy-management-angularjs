angular.module("pharmacyApp").controller("StatisticsController", [
  "$scope",
  "$q",
  "MedsService",
  "CustomersService",
  "InvoicesService",
  function ($scope, $q, MedsService, CustomersService, InvoicesService) {
    $scope.stats = {};
    $scope.loading = true;
    $scope.topMedicines = [];
    $scope.topCustomers = [];

    $scope.loadStats = function () {
      $scope.loading = true;

      $q.all({
        medicines: MedsService.getAll(),
        customers: CustomersService.getAll(),
        invoices: InvoicesService.getAllInvoices(),
        items: InvoicesService.getAllItems(),
      })
        .then(function (results) {
          var meds = results.medicines.data || [];
          var customers = results.customers.data || [];
          var invoices = results.invoices.data || [];
          var items = results.items.data || [];

          // Calculate medicine stats
          var totalMedicines = meds.length;
          var totalStock = 0;
          var totalValue = 0;
          var lowStockCount = 0;
          var outOfStockCount = 0;
          var expiringSoonCount = 0;
          var today = new Date();
          var next30Days = new Date();
          next30Days.setDate(today.getDate() + 30);

          meds.forEach(function (med) {
            var stock = Number(med.stock) || 0;
            var price = Number(med.price) || 0;
            var expiry = med.expiry_date ? new Date(med.expiry_date) : null;

            totalStock += stock;
            totalValue += stock * price;

            if (stock === 0) outOfStockCount++;
            else if (stock <= 10) lowStockCount++;

            if (expiry && expiry >= today && expiry <= next30Days)
              expiringSoonCount++;
          });

          $scope.stats = {
            totalMedicines: totalMedicines,
            totalStock: totalStock,
            totalValue: totalValue,
            lowStockCount: lowStockCount,
            outOfStockCount: outOfStockCount,
            expiringSoonCount: expiringSoonCount,
            totalCustomers: customers.length,
          };

          // Calculate top selling medicines
          var medicineSales = {};
          items.forEach(function (item) {
            if (!medicineSales[item.medicine_id]) {
              medicineSales[item.medicine_id] = 0;
            }
            medicineSales[item.medicine_id] += Number(item.qty) || 0;
          });

          var topMeds = Object.keys(medicineSales)
            .map(function (id) {
              var med = meds.find(function (m) {
                return m.id == id;
              });
              return {
                id: id,
                name: med ? med.name : "Unknown",
                sold: medicineSales[id],
              };
            })
            .sort(function (a, b) {
              return b.sold - a.sold;
            })
            .slice(0, 5);

          $scope.topMedicines = topMeds;

          // Calculate top customers
          var customerPurchases = {};
          invoices.forEach(function (inv) {
            if (!customerPurchases[inv.customer_id]) {
              customerPurchases[inv.customer_id] = 0;
            }
            customerPurchases[inv.customer_id] += Number(inv.total) || 0;
          });

          var topCusts = Object.keys(customerPurchases)
            .map(function (id) {
              var cust = customers.find(function (c) {
                return c.id == id;
              });
              return {
                id: id,
                name: cust ? cust.name : "Unknown",
                total: customerPurchases[id],
              };
            })
            .sort(function (a, b) {
              return b.total - a.total;
            })
            .slice(0, 5);

          $scope.topCustomers = topCusts;

          $scope.loading = false;
        })
        .catch(function (error) {
          console.error("Error loading statistics:", error);
          $scope.loading = false;
        });
    };

    $scope.loadStats();
  },
]);
