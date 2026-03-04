angular.module("pharmacyApp").config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      template: "<h2>Dashboard</h2>",
    })
    .when("/medicines", {
      templateUrl: "app/views/medicines.html",
      controller: "MedicineController",
    })
    .otherwise({
      redirectTo: "/",
    });
});
