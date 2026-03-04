angular.module("pharmacyApp").config([
  "$routeProvider",
  function ($routeProvider) {
    $routeProvider
      .when("/", {
        templateUrl: "app/views/dashboard.html",
      })
      .when("/medicines", {
        templateUrl: "app/views/medicines.html",
        controller: "MedicineController",
      })
      .when("/customers", {
        template: "<h2>Customers</h2><p>Coming soon...</p>",
      })
      .when("/invoices", {
        template: "<h2>Invoices</h2><p>Coming soon...</p>",
      })
      .otherwise({
        redirectTo: "/",
      });
  },
]);
