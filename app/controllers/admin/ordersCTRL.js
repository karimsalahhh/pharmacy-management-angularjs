angular.module("pharmacyApp").controller("OrdersController", [
  "$scope",
  "$q",
  "CustomersService",
  "MedsService",
  "OrdersService",
  function ($scope, $q, CustomersService, MedsService, OrdersService) {
    // CUSTOMER SEARCH
    $scope.phone = "";
    $scope.customer = null; // found or created customer row
    $scope.newCustomer = { name: "", email: "" };
    $scope.customerNotFound = false;

    // MED SEARCH
    $scope.medQuery = "";
    $scope.medResults = [];

    // CURRENT ORDER ITEMS (cart)
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
    $scope.saveOrder = function () {
      if (!$scope.customer) {
        alert("Choose or create a customer first.");
        return;
      }

      if ($scope.cart.length === 0) {
        alert("Add at least 1 medicine.");
        return;
      }

      var orderTotal = calcTotal();

      // 1) Create order
      OrdersService.createOrder({
        customer_id: $scope.customer.id,
        total: orderTotal,
        notes: ($scope.notes || "").trim() || null,
      })
        .then(function (res) {
          // 2) Get order ID from response
          var orderRow = res.data && res.data[0];
          var orderId = orderRow ? orderRow.id : null;

          if (!orderId) {
            throw new Error("Order ID not returned from server");
          }

          // 3) Prepare items for this order
          var items = [];
          for (var i = 0; i < $scope.cart.length; i++) {
            items.push({
              invoice_id: orderId,
              medicine_id: $scope.cart[i].medicine_id,
              qty: $scope.cart[i].quantity,
              unit_price: $scope.cart[i].unit_price,
            });
          }

          // 4) Add items to order
          return OrdersService.addItems(items);
        })
        .then(function () {
          // 5) Reduce stock for all medicines sold
          return reduceStockAfterSale();
        })
        .then(function () {
          // 6) Success! Show alert and clear form
          alert("Order saved successfully!");

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
          console.error("Save order failed:", err);
          var errorMsg = "Failed to save order.";
          if (err.data && err.data.message) {
            errorMsg = err.data.message;
          } else if (err.message) {
            errorMsg = err.message;
          }
          alert(errorMsg);
        });
    };
  },
]);
