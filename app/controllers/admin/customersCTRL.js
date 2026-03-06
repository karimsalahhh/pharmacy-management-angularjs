angular.module("pharmacyApp").controller("CustomersController", [
  "$scope",
  "CustomersService",
  function ($scope, CustomersService) {
    $scope.customers = [];

    $scope.newCustomer = {
      name: "",
      phone: "",
      email: "",
    };

    function loadCustomers() {
      CustomersService.getAll()
        .then(function (res) {
          $scope.customers = res.data;
        })
        .catch(function (err) {
          console.error("Error loading customers:", err);
        });
    }

    function clearForm(form) {
      $scope.newCustomer = { name: "", phone: "", email: "" };
      if (form) {
        form.$setPristine();
        form.$setUntouched();
      }
    }

    $scope.addCustomer = function (form) {
      if (form.$invalid) {
        form.name.$setTouched();
        form.phone.$setTouched();
        form.email.$setTouched();
        return;
      }

      var customer = {
        name: ($scope.newCustomer.name || "").trim(),
        phone: ($scope.newCustomer.phone || "").trim(),
        email: ($scope.newCustomer.email || "").trim(),
      };

      CustomersService.create(customer)
        .then(function () {
          loadCustomers();
          clearForm(form);
        })
        .catch(function (err) {
          console.error("Error adding customer:", err);
        });
    };

    $scope.deleteCustomer = function (id) {
      if (!confirm("Delete this customer?")) return;

      CustomersService.remove(id)
        .then(function () {
          loadCustomers();
        })
        .catch(function (err) {
          console.error("Error deleting customer:", err);
        });
    };

    loadCustomers();
  },
]);
