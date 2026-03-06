angular.module("pharmacyApp").controller("InvoicesController", [
  "$scope",
  "$q",
  "CustomersService",
  "MedsService",
  "InvoicesService",
  function ($scope, $q, CustomersService, MedsService, InvoicesService) {
    // CUSTOMER SEARCH
    $scope.phone = "";
    $scope.customer = null; // found or created customer row
    $scope.newCustomer = { name: "", email: "" };
    $scope.customerNotFound = false;

    // MED SEARCH
    $scope.medQuery = "";
    $scope.medResults = [];

    // CURRENT INVOICE ITEMS (cart)
    $scope.cart = []; // { medicine_id, name, unit_price, quantity }

    $scope.notes = "";
    function reduceStockAfterSale() {
      var stockUpdates = [];

      for (var i = 0; i < $scope.cart.length; i++) {
        (function (item) {
          var request = MedsService.getById(item.medicine_id).then(
            function (res) {
              var med = res.data && res.data[0];
              if (!med) throw new Error("Medicine not found");

              var newStock =
                Number(med.stock || 0) - Number(item.quantity || 0);
              if (newStock < 0)
                throw new Error("Not enough stock for: " + med.name);

              return MedsService.update(item.medicine_id, { stock: newStock });
            },
          );

          stockUpdates.push(request);
        })($scope.cart[i]);
      }

      return $q.all(stockUpdates);
    }

    function calcTotal() {
      var total = 0;
      for (var i = 0; i < $scope.cart.length; i++) {
        total += $scope.cart[i].unit_price * $scope.cart[i].quantity;
      }
      return total;
    }

    $scope.total = 0;

    function refreshTotal() {
      $scope.total = calcTotal();
    }

    // 1) Find customer by phone
    $scope.findCustomer = function () {
      $scope.customer = null;
      $scope.customerNotFound = false;

      var p = ($scope.phone || "").trim();
      if (!p) return;

      CustomersService.findByPhone(p)
        .then(function (res) {
          if (res.data && res.data.length > 0) {
            $scope.customer = res.data[0];
            $scope.customerNotFound = false;
          } else {
            $scope.customerNotFound = true;
          }
        })
        .catch(function (err) {
          console.error("Find customer failed:", err);
        });
    };

    // 2) Create customer quickly (when not found)
    $scope.createCustomer = function () {
      var p = ($scope.phone || "").trim();
      var n = ($scope.newCustomer.name || "").trim();
      var e = ($scope.newCustomer.email || "").trim();

      if (!p || !n) return; // keep simple: phone + name required

      CustomersService.create({ phone: p, name: n, email: e || null })
        .then(function (res) {
          // Supabase may return inserted row if Prefer header is set in that service
          // If not returned, just search again
          if (res.data && res.data.length > 0) {
            $scope.customer = res.data[0];
          } else {
            return CustomersService.findByPhone(p).then(function (r) {
              $scope.customer = r.data[0] || null;
            });
          }

          $scope.customerNotFound = false;
        })
        .catch(function (err) {
          console.error("Create customer failed:", err);
          alert("Could not create customer. Maybe phone already exists.");
        });
    };

    // 3) Search medicines by name
    $scope.searchMeds = function () {
      var q = ($scope.medQuery || "").trim();
      if (!q) {
        $scope.medResults = [];
        return;
      }

      MedsService.searchByName(q)
        .then(function (res) {
          $scope.medResults = res.data || [];
        })
        .catch(function (err) {
          console.error("Search meds failed:", err);
        });
    };

    // 4) Add medicine to invoice cart
    $scope.addToCart = function (m) {
      var qty = Number(m._qty || 1);
      if (!qty || qty < 1) qty = 1;

      var stock = Number(m.stock || 0);

      if (stock <= 0) {
        alert("This medicine is out of stock.");
        return;
      }

      // if already in cart, don't let total quantity exceed stock
      for (var i = 0; i < $scope.cart.length; i++) {
        if ($scope.cart[i].medicine_id === m.id) {
          var newQty = $scope.cart[i].quantity + qty;

          if (newQty > stock) {
            alert("Only " + stock + " items available in stock.");
            return;
          }

          $scope.cart[i].quantity = newQty;
          m._qty = 1;
          refreshTotal();
          return;
        }
      }

      // first time adding this medicine
      if (qty > stock) {
        alert("Only " + stock + " items available in stock.");
        return;
      }

      $scope.cart.push({
        medicine_id: m.id,
        name: m.name,
        unit_price: Number(m.price),
        quantity: qty,
        stock: stock,
      });

      m._qty = 1;
      refreshTotal();
    };

    $scope.removeFromCart = function (index) {
      $scope.cart.splice(index, 1);
      refreshTotal();
    };
    $scope.saveInvoice = function () {
      if (!$scope.customer) {
        alert("Choose or create a customer first.");
        return;
      }

      if ($scope.cart.length === 0) {
        alert("Add at least 1 medicine.");
        return;
      }

      var invoiceTotal = calcTotal();

      checkStockBeforeSave()
        .then(function () {
          return InvoicesService.createInvoice({
            customer_id: $scope.customer.id,
            total: invoiceTotal,
            notes: ($scope.notes || "").trim() || null,
          });
        })
        .then(function (res) {
          var invoiceRow = res.data && res.data[0];
          var invoiceId = invoiceRow ? invoiceRow.id : null;

          if (!invoiceId) throw new Error("Invoice ID not returned");

          var items = [];
          for (var i = 0; i < $scope.cart.length; i++) {
            items.push({
              invoice_id: invoiceId,
              medicine_id: $scope.cart[i].medicine_id,
              qty: $scope.cart[i].quantity,
              unit_price: $scope.cart[i].unit_price,
            });
          }

          return InvoicesService.addItems(items);
        })
        .then(function () {
          return reduceStockAfterSale();
        })
        .then(function () {
          alert("Invoice saved!");

          $scope.cart = [];
          $scope.medResults = [];
          $scope.medQuery = "";
          $scope.notes = "";
          $scope.phone = "";
          $scope.customer = null;
          $scope.customerNotFound = false;
          $scope.newCustomer = { name: "", email: "" };
          refreshTotal();
        })
        .catch(function (err) {
          console.error("Save invoice failed:", err.status, err.data || err);
          alert(err.message || "Failed to save invoice.");
        });
    };
  },
]);
