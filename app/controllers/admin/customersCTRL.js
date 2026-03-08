angular.module("pharmacyApp").controller("CustomersController", [
  "$scope",
  "$location",
  "CustomersService",
  function ($scope, $location, CustomersService) {
    $scope.customers = [];
    $scope.filteredCustomers = [];
    $scope.searchText = "";
    $scope.emailFilter = "all";
    $scope.newCustomer = {
      name: "",
      phone: "",
      email: "",
    };
    $scope.errorMessage = "";
    $scope.successMessage = "";
    $scope.loading = true;

    function loadCustomers() {
      $scope.loading = true;

      CustomersService.getAll()
        .then(function (res) {
          $scope.customers = res.data || [];
          $scope.filterCustomers();
          $scope.loading = false;
        })
        .catch(function (err) {
          console.error("Error loading customers:", err);
          $scope.errorMessage = "Failed to load customers.";
          $scope.loading = false;
        });
    }

    $scope.filterCustomers = function () {
      var filtered = $scope.customers;

      if ($scope.searchText && $scope.searchText.trim()) {
        var searchLower = $scope.searchText.toLowerCase().trim();

        filtered = filtered.filter(function (customer) {
          var name = (customer.name || "").toLowerCase();
          var phone = String(customer.phone || "").toLowerCase();
          var email = (customer.email || "").toLowerCase();

          return (
            name.indexOf(searchLower) !== -1 ||
            phone.indexOf(searchLower) !== -1 ||
            email.indexOf(searchLower) !== -1
          );
        });
      }

      if ($scope.emailFilter !== "all") {
        filtered = filtered.filter(function (customer) {
          var hasEmail = customer.email && customer.email.trim();

          if ($scope.emailFilter === "withEmail") {
            return hasEmail;
          }

          if ($scope.emailFilter === "withoutEmail") {
            return !hasEmail;
          }

          return true;
        });
      }

      $scope.filteredCustomers = filtered;
    };

    $scope.addCustomer = function (form) {
      $scope.errorMessage = "";
      $scope.successMessage = "";

      if (form.$invalid) {
        $scope.errorMessage = "Please fix the highlighted fields first.";
        return;
      }

      var customer = {
        name: ($scope.newCustomer.name || "").trim(),
        phone: ($scope.newCustomer.phone || "").trim(),
        email: ($scope.newCustomer.email || "").trim(),
      };

      CustomersService.create(customer)
        .then(function () {
          $scope.successMessage = "Customer added successfully.";
          loadCustomers();
          $scope.resetForm(form);
        })
        .catch(function (err) {
          console.error("Error adding customer:", err);
          $scope.errorMessage = "Failed to add customer.";
        });
    };

    $scope.deleteCustomer = function (id) {
      if (!confirm("Delete this customer?")) return;

      CustomersService.remove(id)
        .then(function () {
          $scope.successMessage = "Customer deleted successfully.";
          loadCustomers();
        })
        .catch(function (err) {
          console.error("Error deleting customer:", err);
          $scope.errorMessage = "Failed to delete customer.";
        });
    };

    $scope.resetForm = function (form) {
      $scope.newCustomer = {
        name: "",
        phone: "",
        email: "",
      };

      $scope.errorMessage = "";
      $scope.successMessage = "";

      if (form) {
        form.$setPristine();
        form.$setUntouched();
        form.$submitted = false;
      }
    };
    $scope.openCustomerInvoices = function (customer) {
      $location.path("/admin/invoicesDetails").search({
        phone: customer.phone || "",
      });
    };

    loadCustomers();
  },
]);
