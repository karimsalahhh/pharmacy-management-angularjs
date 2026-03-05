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
      .when("/register", {
        templateUrl: "app/views/auth/register.html",
        controller: "RegisterController",
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
      .when("/admin/meds", {
        templateUrl: "app/views/admin/meds.html",
        controller: "MedicineController",
      })
      .when("/admin/customers", {
        templateUrl: "app/views/admin/customers.html",
        controller: "CustomersController",
      })
      .when("/admin/invoices", {
        templateUrl: "app/views/admin/invoices.html",
        controller: "InvoicesController",
      })

      // USER
      .when("/user/home", {
        templateUrl: "app/views/user/home.html",
        controller: "UserIndexController",
      })
      .when("/user/products", {
        templateUrl: "app/views/user/products.html",
        controller: "ProductsController",
      })
      .when("/user/cart", {
        templateUrl: "app/views/user/cart.html",
        controller: "CartController",
      })
      .when("/user/wishlist", {
        templateUrl: "app/views/user/wishlist.html",
        controller: "WishlistController",
      })

      // DEFAULT
      .otherwise({
        redirectTo: "/login",
      });
  },
]);
