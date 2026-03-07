// app/app.routes.js
angular.module("pharmacyApp").config([
  "$routeProvider",
  function ($routeProvider) {
    $routeProvider
      // AUTH
      .when("/login", {
        templateUrl: "app/views/auth/login.html",
        controller: "LoginController",
      })
      // ADMIN
      .when("/admin/dashboard", {
        templateUrl: "app/views/admin/dashboard.html",
        controller: "DashboardController",
      })
      .when("/admin/statistics", {
        templateUrl: "app/views/admin/statistics.html",
        controller: "StatisticsController",
      })
      .when("/admin/medicines", {
        templateUrl: "app/views/admin/medicines.html",
        controller: "MedicineController",
      })
      .when("/admin/customers", {
        templateUrl: "app/views/admin/customers.html",
        controller: "CustomersController",
      })
      .when("/admin/orders", {
        templateUrl: "app/views/admin/orders.html",
        controller: "OrdersController",
      })
      .when("/admin/productSearch", {
        templateUrl: "app/views/admin/productSearch.html",
        controller: "prodsCTRL",
      })
      .when("/admin/invoicesDetails", {
        templateUrl: "app/views/admin/invoicesDetails.html",
        controller: "InvoicesDetailsController",
      })
      .otherwise({
        redirectTo: "app/views/admin/dashboard.html",
      });
  },
]);
